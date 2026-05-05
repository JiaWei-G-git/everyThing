"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardWebviewViewProvider = void 0;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const RecentService_1 = require("../services/RecentService");
class DashboardWebviewViewProvider {
    constructor(_extensionUri, _knowledgeService, _searchService, _installService, _recentService) {
        this._extensionUri = _extensionUri;
        this._knowledgeService = _knowledgeService;
        this._searchService = _searchService;
        this._installService = _installService;
        this._recentService = _recentService;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'ready':
                    this._sendInitialData();
                    break;
                case 'open:skill':
                    await this._handleOpenSkill(message.skillId);
                    break;
                case 'search:query':
                    await this._handleSearch(message.query);
                    break;
                case 'install:skill':
                    await this._handleInstall(message.skillId, message.target);
                    break;
                case 'copy:prompt':
                    await this._handleCopyPrompt(message.skillId);
                    break;
                case 'toggle:favorite':
                    await this._handleToggleFavorite(message.skillId);
                    break;
                case 'get:settings':
                    this._sendSettings();
                    break;
                case 'save:settings':
                    await this._handleSaveSettings(message.data);
                    break;
                case 'switch:viewMode':
                    this._recentService.setViewMode(message.mode);
                    break;
                case 'track:scenario':
                    this._recentService.trackScenarioUsage(message.scenarioId);
                    break;
                case 'get:scenarios':
                    this._handleGetScenarios();
                    break;
            }
        });
    }
    _getHtml(webview) {
        const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'dashboard.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css'));
        const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.js'));
        html = html.replace('{{CSS_URI}}', cssUri.toString());
        html = html.replace('{{JS_URI}}', jsUri.toString());
        return html;
    }
    _sendInitialData() {
        if (!this._view)
            return;
        const kb = this._knowledgeService.getKnowledgeBase();
        const recent = this._recentService.getRecent();
        const favorites = this._recentService.getFavorites();
        const stats = this._recentService.getStats(kb);
        const usageStats = this._recentService.getUsageStats();
        const topScenarios = this._recentService.getTopScenarios();
        const viewMode = this._recentService.getViewMode();
        this._view.webview.postMessage({
            type: 'init:data',
            data: { clusters: kb.clusters, agents: kb.agents, skills: kb.skills }
        });
        this._view.webview.postMessage({
            type: 'init:state',
            data: { recent, favorites, stats, usageStats, topScenarios, viewMode }
        });
    }
    async _handleOpenSkill(skillId) {
        const skill = this._knowledgeService.getSkill(skillId);
        if (skill && skill.scenarioTags.length > 0) {
            this._recentService.trackScenarioUsage(skill.scenarioTags[0]);
        }
        this._recentService.addRecent(skillId, this._knowledgeService);
        this._sendInitialData();
    }
    async _handleSearch(query) {
        const results = this._searchService.search(query);
        this._view?.webview.postMessage({
            type: 'search:result',
            data: results
        });
    }
    async _handleInstall(skillId, target) {
        const skill = this._knowledgeService.getSkill(skillId);
        if (!skill) {
            this._view?.webview.postMessage({
                type: 'install:result',
                data: { success: false, message: '技能未找到' }
            });
            return;
        }
        const result = await this._installService.install(skill, target);
        this._view?.webview.postMessage({
            type: 'install:result',
            data: result
        });
    }
    async _handleCopyPrompt(skillId) {
        const skill = this._knowledgeService.getSkill(skillId);
        if (!skill)
            return;
        await vscode.env.clipboard.writeText(skill.content);
        this._view?.webview.postMessage({
            type: 'copy:result',
            data: { success: true, message: `${skill.name} 的 Prompt 已复制` }
        });
    }
    async _handleToggleFavorite(skillId) {
        this._recentService.toggleFavorite(skillId);
        this._sendInitialData();
    }
    _sendSettings() {
        const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
        this._view?.webview.postMessage({
            type: 'settings:data',
            data: {
                localPath: config.get('localPath', ''),
                defaultInstallTarget: config.get('defaultInstallTarget', 'claude-code')
            }
        });
    }
    async _handleSaveSettings(data) {
        const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
        await config.update('localPath', data.localPath, true);
        await config.update('defaultInstallTarget', data.defaultInstallTarget, true);
        this._sendSettings();
    }
    _handleGetScenarios() {
        this._view?.webview.postMessage({
            type: 'scenarios:data',
            data: RecentService_1.SCENARIOS
        });
    }
    refresh() {
        this._sendInitialData();
    }
}
exports.DashboardWebviewViewProvider = DashboardWebviewViewProvider;
DashboardWebviewViewProvider.viewType = 'aiKnowledgeBase.sidebar';
//# sourceMappingURL=DashboardWebviewViewProvider.js.map