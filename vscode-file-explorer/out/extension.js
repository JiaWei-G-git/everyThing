"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const KnowledgeService_1 = require("./services/KnowledgeService");
const SearchService_1 = require("./services/SearchService");
const InstallService_1 = require("./services/InstallService");
const KnowledgeTreeProvider_1 = require("./providers/KnowledgeTreeProvider");
const SkillDetailProvider_1 = require("./providers/SkillDetailProvider");
function activate(context) {
    try {
        // 初始化服务
        const knowledgeService = new KnowledgeService_1.KnowledgeService(context.extensionPath);
        const searchService = new SearchService_1.SearchService(knowledgeService);
        const installService = new InstallService_1.InstallService();
        // 注册 TreeView（立即注册，即使数据还未加载）
        const treeProvider = new KnowledgeTreeProvider_1.KnowledgeTreeProvider(knowledgeService);
        const treeView = vscode.window.createTreeView('aiKnowledgeBase.sidebar', {
            treeDataProvider: treeProvider,
            showCollapseAll: true
        });
        context.subscriptions.push(treeView);
        // 异步加载知识库
        knowledgeService.loadKnowledgeBase()
            .then((kb) => {
            const totalSkills = kb.skills.length;
            const totalAgents = kb.agents.length;
            const totalClusters = kb.clusters.length;
            if (totalClusters > 0) {
                treeProvider.refresh();
            }
            else {
                vscode.window.showWarningMessage('AI知识库: 未找到任何集群数据，请检查模板文件');
            }
        })
            .catch((err) => {
            vscode.window.showErrorMessage(`AI知识库加载失败: ${err.message || err}`);
            console.error('Knowledge base load error:', err);
        });
        // 打开技能详情
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.openSkill', (skillId) => {
            SkillDetailProvider_1.SkillDetailProvider.createOrShow(context.extensionUri, knowledgeService, skillId);
        }));
        // 搜索技能
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.searchSkills', async () => {
            const query = await vscode.window.showInputBox({
                placeHolder: '输入技能名称、标签或关键词',
                prompt: '搜索 AI 技能'
            });
            if (!query)
                return;
            const results = searchService.search(query);
            if (results.length === 0) {
                vscode.window.showInformationMessage('未找到匹配的技能');
                return;
            }
            const items = results.map(r => ({
                label: r.skill.name,
                description: r.skill.description,
                detail: `${r.skill.cluster} | 匹配: ${r.matchedFields.join(', ')}`,
                skillId: r.skill.id
            }));
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: `找到 ${results.length} 个结果`
            });
            if (selected) {
                vscode.commands.executeCommand('aiKnowledgeBase.openSkill', selected.skillId);
            }
        }));
        // 安装到 Claude Code
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.installToClaude', async (skillId) => {
            const skill = knowledgeService.getSkill(skillId);
            if (!skill)
                return;
            const result = await installService.install(skill, 'claude-code');
            if (result.success) {
                vscode.window.showInformationMessage(result.message);
            }
            else {
                const action = await vscode.window.showWarningMessage(result.message, '手动安装', '取消');
                if (action === '手动安装') {
                    await installService.promptManualInstall(skill, result.path || '');
                }
            }
        }));
        // 安装到 Cursor
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.installToCursor', async (skillId) => {
            const skill = knowledgeService.getSkill(skillId);
            if (!skill)
                return;
            const result = await installService.install(skill, 'cursor');
            if (result.success) {
                vscode.window.showInformationMessage(result.message);
            }
            else {
                const action = await vscode.window.showWarningMessage(result.message, '手动安装', '取消');
                if (action === '手动安装') {
                    await installService.promptManualInstall(skill, result.path || '');
                }
            }
        }));
        // 复制 Prompt
        context.subscriptions.push(vscode.commands.registerCommand('aiKnowledgeBase.copyPrompt', async (skillId) => {
            const skill = knowledgeService.getSkill(skillId);
            if (!skill)
                return;
            await vscode.env.clipboard.writeText(skill.content);
            vscode.window.showInformationMessage(`${skill.name} 的 Prompt 已复制到剪贴板`);
        }));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`AI知识库插件初始化失败: ${msg}`);
        console.error('Extension activation error:', err);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map