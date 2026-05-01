"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
class SearchService {
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    search(query) {
        if (!query.trim()) {
            return [];
        }
        const kb = this.knowledgeService.getKnowledgeBase();
        const lowerQuery = query.toLowerCase();
        const results = [];
        for (const skill of kb.skills) {
            let score = 0;
            const matchedFields = [];
            // 名称匹配（权重最高）
            if (skill.name.toLowerCase().includes(lowerQuery)) {
                score += 10;
                matchedFields.push('名称');
            }
            // 描述匹配
            if (skill.description.toLowerCase().includes(lowerQuery)) {
                score += 5;
                matchedFields.push('描述');
            }
            // 标签匹配
            if (skill.tags.some(t => t.toLowerCase().includes(lowerQuery))) {
                score += 7;
                matchedFields.push('标签');
            }
            // 内容匹配
            if (skill.content.toLowerCase().includes(lowerQuery)) {
                score += 3;
                matchedFields.push('内容');
            }
            // 所属智能体匹配
            const agent = kb.agents.find(a => a.id === skill.parentAgent);
            if (agent && agent.name.toLowerCase().includes(lowerQuery)) {
                score += 4;
                matchedFields.push('智能体');
            }
            // 集群匹配
            const cluster = kb.clusters.find(c => c.id === skill.cluster);
            if (cluster && cluster.name.toLowerCase().includes(lowerQuery)) {
                score += 3;
                matchedFields.push('集群');
            }
            if (score > 0) {
                results.push({ skill, score, matchedFields });
            }
        }
        // 按分数排序
        return results.sort((a, b) => b.score - a.score);
    }
    getSkillsByRole(roleName) {
        const kb = this.knowledgeService.getKnowledgeBase();
        const agentIds = kb.agents
            .filter(a => a.roles.includes(roleName))
            .map(a => a.id);
        return kb.skills.filter(s => {
            const agent = kb.agents.find(a => a.id === s.parentAgent);
            return agent && agentIds.includes(agent.id);
        });
    }
    getSkillsByTag(tag) {
        const kb = this.knowledgeService.getKnowledgeBase();
        return kb.skills.filter(s => s.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=SearchService.js.map