"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentService = exports.SCENARIOS = void 0;
const MAX_RECENT = 20;
const RECENT_KEY = 'aiKnowledgeBase.recent';
const FAVORITES_KEY = 'aiKnowledgeBase.favorites';
const USAGE_STATS_KEY = 'aiKnowledgeBase.usageStats';
const VIEW_MODE_KEY = 'aiKnowledgeBase.viewMode';
exports.SCENARIOS = [
    { id: 'write-doc', name: '写文档', icon: '📝' },
    { id: 'troubleshoot', name: '查故障', icon: '🔧' },
    { id: 'write-code', name: '写代码', icon: '💻' },
    { id: 'data-work', name: '搞数据', icon: '🗄️' },
    { id: 'design', name: '做设计', icon: '📐' },
    { id: 'manage-project', name: '管项目', icon: '📊' },
    { id: 'test-quality', name: '测试质量', icon: '✅' },
    { id: 'knowledge', name: '知识检索', icon: '📚' }
];
class RecentService {
    constructor(context) {
        this.context = context;
    }
    getRecent() {
        return this.context.globalState.get(RECENT_KEY, []);
    }
    getFavorites() {
        return this.context.globalState.get(FAVORITES_KEY, []);
    }
    addRecent(skillId, knowledgeService) {
        const skill = knowledgeService.getSkill(skillId);
        if (!skill)
            return;
        const kb = knowledgeService.getKnowledgeBase();
        const agent = kb.agents.find(a => a.id === skill.parentAgent);
        const cluster = kb.clusters.find(c => c.id === skill.cluster);
        const recent = this.getRecent();
        const newItem = {
            skillId,
            skillName: skill.name,
            agentName: agent?.name || '未知智能体',
            clusterName: cluster?.name || '未知集群',
            timestamp: Date.now()
        };
        const filtered = recent.filter(r => r.skillId !== skillId);
        filtered.unshift(newItem);
        const trimmed = filtered.slice(0, MAX_RECENT);
        this.context.globalState.update(RECENT_KEY, trimmed);
        this.trackSkillUsage(skillId);
    }
    toggleFavorite(skillId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(skillId);
        if (index > -1) {
            favorites.splice(index, 1);
        }
        else {
            favorites.push(skillId);
        }
        this.context.globalState.update(FAVORITES_KEY, favorites);
    }
    getStats(kb) {
        const allScenarioTags = new Set();
        for (const skill of kb.skills) {
            for (const tag of skill.scenarioTags) {
                allScenarioTags.add(tag);
            }
        }
        return {
            clusterCount: kb.clusters.length,
            agentCount: kb.agents.length,
            skillCount: kb.skills.length,
            scenarioCount: allScenarioTags.size || exports.SCENARIOS.length
        };
    }
    getUsageStats() {
        return this.context.globalState.get(USAGE_STATS_KEY, {
            skillUsage: {},
            scenarioUsage: {},
            lastUsed: Date.now()
        });
    }
    trackSkillUsage(skillId) {
        const stats = this.getUsageStats();
        stats.skillUsage[skillId] = (stats.skillUsage[skillId] || 0) + 1;
        stats.lastUsed = Date.now();
        this.context.globalState.update(USAGE_STATS_KEY, stats);
    }
    trackScenarioUsage(scenarioTag) {
        const stats = this.getUsageStats();
        stats.scenarioUsage[scenarioTag] = (stats.scenarioUsage[scenarioTag] || 0) + 1;
        stats.lastUsed = Date.now();
        this.context.globalState.update(USAGE_STATS_KEY, stats);
    }
    getTopScenarios(limit = 5) {
        const stats = this.getUsageStats();
        return Object.entries(stats.scenarioUsage)
            .map(([id, count]) => {
            const scenario = exports.SCENARIOS.find(s => s.id === id);
            return { id, name: scenario?.name || id, count };
        })
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    getViewMode() {
        return this.context.globalState.get(VIEW_MODE_KEY, 'role');
    }
    setViewMode(mode) {
        this.context.globalState.update(VIEW_MODE_KEY, mode);
    }
}
exports.RecentService = RecentService;
//# sourceMappingURL=RecentService.js.map