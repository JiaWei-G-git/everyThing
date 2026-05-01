"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeTreeProvider = void 0;
const vscode = require("vscode");
class KnowledgeTreeProvider {
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        treeItem.description = element.description;
        treeItem.tooltip = element.description;
        switch (element.type) {
            case 'cluster':
                treeItem.iconPath = new vscode.ThemeIcon('folder');
                break;
            case 'agent':
                treeItem.iconPath = new vscode.ThemeIcon('robot');
                break;
            case 'skill':
                treeItem.iconPath = new vscode.ThemeIcon('zap');
                break;
        }
        if (element.type === 'skill') {
            treeItem.command = {
                command: 'aiKnowledgeBase.openSkill',
                title: '打开技能详情',
                arguments: [element.id]
            };
        }
        treeItem.contextValue = element.type;
        return treeItem;
    }
    getChildren(element) {
        if (!element) {
            return this.getClusterNodes();
        }
        switch (element.type) {
            case 'cluster':
                return this.getAgentNodes(element.id);
            case 'agent':
                return this.getSkillNodes(element.id);
            default:
                return [];
        }
    }
    getClusterNodes() {
        const kb = this.knowledgeService.getKnowledgeBase();
        return kb.clusters.map(cluster => ({
            id: cluster.id,
            label: cluster.name,
            description: `${cluster.agents.length} 智能体, ${cluster.skills.length} 技能`,
            type: 'cluster',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        }));
    }
    getAgentNodes(clusterId) {
        const kb = this.knowledgeService.getKnowledgeBase();
        const cluster = kb.clusters.find(c => c.id === clusterId);
        if (!cluster)
            return [];
        return cluster.agents
            .map(agentId => kb.agents.find(a => a.id === agentId))
            .filter((a) => !!a)
            .map(agent => ({
            id: agent.id,
            label: agent.name,
            description: agent.description,
            type: 'agent',
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
        }));
    }
    getSkillNodes(agentId) {
        const kb = this.knowledgeService.getKnowledgeBase();
        const agent = kb.agents.find(a => a.id === agentId);
        if (!agent)
            return [];
        return agent.skills
            .map(skillId => kb.skills.find(s => s.id === skillId))
            .filter((s) => !!s)
            .map(skill => ({
            id: skill.id,
            label: skill.name,
            description: skill.description,
            type: 'skill',
            collapsibleState: vscode.TreeItemCollapsibleState.None
        }));
    }
}
exports.KnowledgeTreeProvider = KnowledgeTreeProvider;
//# sourceMappingURL=KnowledgeTreeProvider.js.map