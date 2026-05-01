import * as vscode from 'vscode';
import { KnowledgeService } from './services/KnowledgeService';
import { SearchService } from './services/SearchService';
import { InstallService } from './services/InstallService';
import { RecentService } from './services/RecentService';
import { DashboardWebviewViewProvider } from './providers/DashboardWebviewViewProvider';

export function activate(context: vscode.ExtensionContext) {
  try {
    const knowledgeService = new KnowledgeService(context.extensionPath);
    const searchService = new SearchService(knowledgeService);
    const installService = new InstallService();
    const recentService = new RecentService(context);

    const dashboardProvider = new DashboardWebviewViewProvider(
      context.extensionUri,
      knowledgeService,
      searchService,
      installService,
      recentService
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        DashboardWebviewViewProvider.viewType,
        dashboardProvider
      )
    );

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

    context.subscriptions.push(
      vscode.commands.registerCommand('aiKnowledgeBase.refreshDashboard', () => {
        dashboardProvider.refresh();
      })
    );

    const hasShownWidthHint = context.globalState.get('aiKnowledgeBase.hasShownWidthHint', false);
    if (!hasShownWidthHint) {
      setTimeout(() => {
        vscode.window.showInformationMessage(
          'AI 技能知识库: 建议将左侧边栏宽度拉至 550px 以上以获得最佳体验',
          '知道了'
        );
        context.globalState.update('aiKnowledgeBase.hasShownWidthHint', true);
      }, 2000);
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`AI知识库插件初始化失败: ${msg}`);
    console.error('Extension activation error:', err);
  }
}

export function deactivate() {}
