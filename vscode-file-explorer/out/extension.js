"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const KnowledgeService_1 = require("./services/KnowledgeService");
const SearchService_1 = require("./services/SearchService");
const InstallService_1 = require("./services/InstallService");
const RecentService_1 = require("./services/RecentService");
const DashboardWebviewViewProvider_1 = require("./providers/DashboardWebviewViewProvider");
function activate(context) {
    try {
        const knowledgeService = new KnowledgeService_1.KnowledgeService(context.extensionPath);
        const searchService = new SearchService_1.SearchService(knowledgeService);
        const installService = new InstallService_1.InstallService();
        const recentService = new RecentService_1.RecentService(context);
        const dashboardProvider = new DashboardWebviewViewProvider_1.DashboardWebviewViewProvider(context.extensionUri, knowledgeService, searchService, installService, recentService);
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(DashboardWebviewViewProvider_1.DashboardWebviewViewProvider.viewType, dashboardProvider));
        knowledgeService.loadKnowledgeBase()
            .then((kb) => {
            if (kb.clusters.length === 0) {
                vscode.window.showWarningMessage('AI知识库: 未找到任何集群数据，请检查模板文件');
            }
        })
            .catch((err) => {
            vscode.window.showErrorMessage(`AI知识库加载失败: ${err.message || err}`);
            console.error('Knowledge base load error:', err);
        });
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.refreshDashboard', () => {
            dashboardProvider.refresh();
        }));
        const hasShownWidthHint = context.globalState.get('aiKnowledgeBase.hasShownWidthHint', false);
        if (!hasShownWidthHint) {
            setTimeout(() => {
                vscode.window.showInformationMessage('AI 技能知识库: 建议将左侧边栏宽度拉至 550px 以上以获得最佳体验', '知道了');
                context.globalState.update('aiKnowledgeBase.hasShownWidthHint', true);
            }, 2000);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`AI知识库插件初始化失败: ${msg}`);
        console.error('Extension activation error:', err);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map