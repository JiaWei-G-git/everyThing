import * as vscode from 'vscode';
import { KnowledgeService } from './KnowledgeService';
import { RecentItem, DashboardStats, KnowledgeBase } from '../models/types';

const MAX_RECENT = 20;
const RECENT_KEY = 'aiKnowledgeBase.recent';
const FAVORITES_KEY = 'aiKnowledgeBase.favorites';

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
    return {
      clusterCount: kb.clusters.length,
      agentCount: kb.agents.length,
      skillCount: kb.skills.length,
      scenarioCount: kb.scenes.length
    };
  }
}
