import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { KnowledgeService } from '../services/KnowledgeService';
import { SearchService } from '../services/SearchService';
import { InstallService } from '../services/InstallService';
import { RecentService } from '../services/RecentService';

export class DashboardWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiKnowledgeBase.sidebar';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _knowledgeService: KnowledgeService,
    private readonly _searchService: SearchService,
    private readonly _installService: InstallService,
    private readonly _recentService: RecentService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
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
        }
      }
    );
  }

  private _getHtml(webview: vscode.Webview): string {
    const htmlPath = path.join(this._extensionUri.fsPath, 'media', 'dashboard.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'dashboard.js'));

    html = html.replace('{{CSS_URI}}', cssUri.toString());
    html = html.replace('{{JS_URI}}', jsUri.toString());

    return html;
  }

  private _sendInitialData() {
    if (!this._view) return;

    const kb = this._knowledgeService.getKnowledgeBase();
    const recent = this._recentService.getRecent();
    const favorites = this._recentService.getFavorites();
    const stats = this._recentService.getStats(kb);

    this._view.webview.postMessage({
      type: 'init:data',
      data: { clusters: kb.clusters, agents: kb.agents, skills: kb.skills }
    });

    this._view.webview.postMessage({
      type: 'init:state',
      data: { recent, favorites, stats }
    });
  }

  private async _handleOpenSkill(skillId: string) {
    this._recentService.addRecent(skillId, this._knowledgeService);
    this._sendInitialData();
  }

  private async _handleSearch(query: string) {
    const results = this._searchService.search(query);
    this._view?.webview.postMessage({
      type: 'search:result',
      data: results
    });
  }

  private async _handleInstall(skillId: string, target: string) {
    const skill = this._knowledgeService.getSkill(skillId);
    if (!skill) {
      this._view?.webview.postMessage({
        type: 'install:result',
        data: { success: false, message: '技能未找到' }
      });
      return;
    }

    const result = await this._installService.install(skill, target as 'claude-code' | 'cursor');
    this._view?.webview.postMessage({
      type: 'install:result',
      data: result
    });
  }

  private async _handleCopyPrompt(skillId: string) {
    const skill = this._knowledgeService.getSkill(skillId);
    if (!skill) return;

    await vscode.env.clipboard.writeText(skill.content);
    this._view?.webview.postMessage({
      type: 'copy:result',
      data: { success: true, message: `${skill.name} 的 Prompt 已复制` }
    });
  }

  private async _handleToggleFavorite(skillId: string) {
    this._recentService.toggleFavorite(skillId);
    this._sendInitialData();
  }

  private _sendSettings() {
    const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
    this._view?.webview.postMessage({
      type: 'settings:data',
      data: {
        localPath: config.get('localPath', ''),
        defaultInstallTarget: config.get('defaultInstallTarget', 'claude-code')
      }
    });
  }

  private async _handleSaveSettings(data: { localPath: string; defaultInstallTarget: string }) {
    const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
    await config.update('localPath', data.localPath, true);
    await config.update('defaultInstallTarget', data.defaultInstallTarget, true);
    this._sendSettings();
  }

  public refresh() {
    this._sendInitialData();
  }
}
