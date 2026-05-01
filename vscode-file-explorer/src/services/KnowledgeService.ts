import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBase, Cluster, Agent, Skill } from '../models/types';
import { parseMarkdown } from '../utils/markdownParser';

export class KnowledgeService {
  private knowledgeBase: KnowledgeBase = {
    clusters: [],
    agents: [],
    skills: [],
    scenes: [],
    roles: []
  };

  constructor(private extensionPath: string) {}

  public async loadKnowledgeBase(): Promise<KnowledgeBase> {
    const templatesPath = path.join(this.extensionPath, 'templates');
    const clustersPath = path.join(templatesPath, 'clusters');

    if (!fs.existsSync(clustersPath)) {
      return this.knowledgeBase;
    }

    await this.scanClusters(clustersPath);
    return this.knowledgeBase;
  }

  private async scanClusters(clustersPath: string): Promise<void> {
    const entries = fs.readdirSync(clustersPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
        await this.scanCluster(path.join(clustersPath, entry.name), entry.name);
      }
    }
  }

  private async scanCluster(clusterPath: string, clusterId: string): Promise<void> {
    const clusterName = clusterId.replace(/^\d{2}-/, '');
    const cluster: Cluster = {
      id: clusterId,
      name: clusterName,
      description: '',
      agents: [],
      skills: []
    };

    const entries = fs.readdirSync(clusterPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'INDEX.md') {
        const agent = await this.parseAgent(
          path.join(clusterPath, entry.name),
          clusterId
        );
        if (agent) {
          cluster.agents.push(agent.id);
          this.knowledgeBase.agents.push(agent);
        }
      } else if (entry.isDirectory() && entry.name === 'skills') {
        const skills = await this.scanSkills(
          path.join(clusterPath, entry.name),
          clusterId
        );
        cluster.skills.push(...skills.map(s => s.id));
        this.knowledgeBase.skills.push(...skills);
      }
    }

    this.knowledgeBase.clusters.push(cluster);
  }

  private async parseAgent(filePath: string, clusterId: string): Promise<Agent | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseMarkdown(content);
    const fm = parsed.frontmatter;

    if (fm.type !== 'agent') {
      return null;
    }

    const fileName = path.basename(filePath, '.md');

    // 从技能清单表格提取技能ID列表
    const skills: string[] = fm.skills || [];
    if (skills.length === 0) {
      // 尝试从 Markdown 内容中提取技能链接
      const skillMatches = content.matchAll(/\[([^\]]+)\]\(skills\/([^)]+)\.md\)/g);
      for (const match of skillMatches) {
        skills.push(match[2]);
      }
    }

    return {
      id: fileName,
      name: fm.name || fileName,
      description: fm.description || '',
      cluster: clusterId,
      roles: fm.roles || [],
      skills: skills,
      filePath
    };
  }

  private async scanSkills(skillsPath: string, clusterId: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    const entries = fs.readdirSync(skillsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const skill = await this.parseSkill(
          path.join(skillsPath, entry.name),
          clusterId
        );
        if (skill) {
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  private async parseSkill(filePath: string, clusterId: string): Promise<Skill | null> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseMarkdown(content);
    const fm = parsed.frontmatter;

    if (fm.type !== 'skill') {
      return null;
    }

    const fileName = path.basename(filePath, '.md');
    return {
      id: fileName,
      name: fm.name || fileName,
      description: fm.description || '',
      type: 'skill',
      version: fm.version || '1.0.0',
      date: fm.date || '',
      parentAgent: fm.parentAgent || '',
      cluster: clusterId,
      standalone: fm.standalone ?? true,
      tags: fm.tags || [],
      input: fm.input,
      output: fm.output,
      estimatedTime: fm.estimatedTime,
      filePath,
      content: parsed.content
    };
  }

  public getKnowledgeBase(): KnowledgeBase {
    return this.knowledgeBase;
  }

  public getSkill(id: string): Skill | undefined {
    return this.knowledgeBase.skills.find(s => s.id === id);
  }

  public getAgent(id: string): Agent | undefined {
    return this.knowledgeBase.agents.find(a => a.id === id);
  }

  public getCluster(id: string): Cluster | undefined {
    return this.knowledgeBase.clusters.find(c => c.id === id);
  }
}
