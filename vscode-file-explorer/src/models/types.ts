import * as vscode from 'vscode';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'skill';
  version: string;
  date: string;
  parentAgent: string;
  cluster: string;
  standalone: boolean;
  tags: string[];
  input?: string;
  output?: string;
  estimatedTime?: string;
  filePath: string;
  content: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  cluster: string;
  roles: string[];
  skills: string[];
  filePath: string;
}

export interface Cluster {
  id: string;
  name: string;
  description: string;
  agents: string[];
  skills: string[];
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
}

export interface KnowledgeBase {
  clusters: Cluster[];
  agents: Agent[];
  skills: Skill[];
  scenes: Scene[];
  roles: Role[];
}

export interface ParsedMarkdown {
  frontmatter: Record<string, any>;
  content: string;
}

export type TreeNodeType = 'cluster' | 'agent' | 'skill';

export interface TreeNode {
  id: string;
  label: string;
  description?: string;
  type: TreeNodeType;
  children?: TreeNode[];
  collapsibleState: vscode.TreeItemCollapsibleState;
}

export interface RecentItem {
  skillId: string;
  skillName: string;
  agentName: string;
  clusterName: string;
  timestamp: number;
}

export interface DashboardStats {
  clusterCount: number;
  agentCount: number;
  skillCount: number;
}
