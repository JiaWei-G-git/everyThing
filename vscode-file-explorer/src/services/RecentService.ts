import * as vscode from 'vscode';
import { KnowledgeService } from './KnowledgeService';
import { RecentItem, DashboardStats, KnowledgeBase, UsageStats, ViewMode } from '../models/types';

const MAX_RECENT = 20;
const RECENT_KEY = 'aiKnowledgeBase.recent';
const FAVORITES_KEY = 'aiKnowledgeBase.favorites';
const USAGE_STATS_KEY = 'aiKnowledgeBase.usageStats';
const VIEW_MODE_KEY = 'aiKnowledgeBase.viewMode';

export const SCENARIOS = [
  { id: 'write-doc', name: '写文档', icon: '📝' },
  { id: 'troubleshoot', name: '查故障', icon: '🔧' },
  { id: 'write-code', name: '写代码', icon: '💻' },
  { id: 'data-work', name: '搞数据', icon: '🗄️' },
  { id: 'design', name: '做设计', icon: '📐' },
  { id: 'manage-project', name: '管项目', icon: '📊' },
  { id: 'test-quality', name: '测试质量', icon: '✅' },
  { id: 'knowledge', name: '知识检索', icon: '📚' }
];

export class RecentService {
  constructor(private context: vscode.ExtensionContext) {}

  getRecent(): RecentItem[] {
    return this.context.globalState.get<RecentItem[]>(RECENT_KEY, []);
  }

  getFavorites(): string[] {
    return this.context.globalState.get<string[]>(FAVORITES_KEY, []);
  }

  addRecent(skillId: string, knowledgeService: KnowledgeService): void {
    const skill = knowledgeService.getSkill(skillId);
    if (!skill) return;

    const kb = knowledgeService.getKnowledgeBase();
    const agent = kb.agents.find(a => a.id === skill.parentAgent);
    const cluster = kb.clusters.find(c => c.id === skill.cluster);

    const recent = this.getRecent();
    const newItem: RecentItem = {
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

  toggleFavorite(skillId: string): void {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(skillId);
    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(skillId);
    }
    this.context.globalState.update(FAVORITES_KEY, favorites);
  }

  getStats(kb: KnowledgeBase): DashboardStats {
    const allScenarioTags = new Set<string>();
    for (const skill of kb.skills) {
      for (const tag of skill.scenarioTags) {
        allScenarioTags.add(tag);
      }
    }
    return {
      clusterCount: kb.clusters.length,
      agentCount: kb.agents.length,
      skillCount: kb.skills.length,
      scenarioCount: allScenarioTags.size || SCENARIOS.length
    };
  }

  getUsageStats(): UsageStats {
    return this.context.globalState.get<UsageStats>(USAGE_STATS_KEY, {
      skillUsage: {},
      scenarioUsage: {},
      lastUsed: Date.now()
    });
  }

  trackSkillUsage(skillId: string): void {
    const stats = this.getUsageStats();
    stats.skillUsage[skillId] = (stats.skillUsage[skillId] || 0) + 1;
    stats.lastUsed = Date.now();
    this.context.globalState.update(USAGE_STATS_KEY, stats);
  }

  trackScenarioUsage(scenarioTag: string): void {
    const stats = this.getUsageStats();
    stats.scenarioUsage[scenarioTag] = (stats.scenarioUsage[scenarioTag] || 0) + 1;
    stats.lastUsed = Date.now();
    this.context.globalState.update(USAGE_STATS_KEY, stats);
  }

  getTopScenarios(limit: number = 5): { id: string; name: string; count: number }[] {
    const stats = this.getUsageStats();
    return Object.entries(stats.scenarioUsage)
      .map(([id, count]) => {
        const scenario = SCENARIOS.find(s => s.id === id);
        return { id, name: scenario?.name || id, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getViewMode(): ViewMode {
    return this.context.globalState.get<ViewMode>(VIEW_MODE_KEY, 'role');
  }

  setViewMode(mode: ViewMode): void {
    this.context.globalState.update(VIEW_MODE_KEY, mode);
  }
}
