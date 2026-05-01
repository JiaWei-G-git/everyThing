"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const fs = require("fs");
const path = require("path");
const markdownParser_1 = require("../utils/markdownParser");
class KnowledgeService {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.knowledgeBase = {
            clusters: [],
            agents: [],
            skills: [],
            scenes: [],
            roles: []
        };
    }
    async loadKnowledgeBase() {
        const templatesPath = path.join(this.extensionPath, 'templates');
        const clustersPath = path.join(templatesPath, 'clusters');
        if (!fs.existsSync(clustersPath)) {
            return this.knowledgeBase;
        }
        await this.scanClusters(clustersPath);
        return this.knowledgeBase;
    }
    async scanClusters(clustersPath) {
        const entries = fs.readdirSync(clustersPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
                await this.scanCluster(path.join(clustersPath, entry.name), entry.name);
            }
        }
    }
    async scanCluster(clusterPath, clusterId) {
        const clusterName = clusterId.replace(/^\d{2}-/, '');
        const cluster = {
            id: clusterId,
            name: clusterName,
            description: '',
            agents: [],
            skills: []
        };
        const entries = fs.readdirSync(clusterPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'INDEX.md') {
                const agent = await this.parseAgent(path.join(clusterPath, entry.name), clusterId);
                if (agent) {
                    cluster.agents.push(agent.id);
                    this.knowledgeBase.agents.push(agent);
                }
            }
            else if (entry.isDirectory() && entry.name === 'skills') {
                const skills = await this.scanSkills(path.join(clusterPath, entry.name), clusterId);
                cluster.skills.push(...skills.map(s => s.id));
                this.knowledgeBase.skills.push(...skills);
            }
        }
        this.knowledgeBase.clusters.push(cluster);
    }
    async parseAgent(filePath, clusterId) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = (0, markdownParser_1.parseMarkdown)(content);
        const fm = parsed.frontmatter;
        if (fm.type !== 'agent') {
            return null;
        }
        const fileName = path.basename(filePath, '.md');
        // 从技能清单表格提取技能ID列表
        const skills = fm.skills || [];
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
    async scanSkills(skillsPath, clusterId) {
        const skills = [];
        const entries = fs.readdirSync(skillsPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                const skill = await this.parseSkill(path.join(skillsPath, entry.name), clusterId);
                if (skill) {
                    skills.push(skill);
                }
            }
        }
        return skills;
    }
    async parseSkill(filePath, clusterId) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = (0, markdownParser_1.parseMarkdown)(content);
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
    getKnowledgeBase() {
        return this.knowledgeBase;
    }
    getSkill(id) {
        return this.knowledgeBase.skills.find(s => s.id === id);
    }
    getAgent(id) {
        return this.knowledgeBase.agents.find(a => a.id === id);
    }
    getCluster(id) {
        return this.knowledgeBase.clusters.find(c => c.id === id);
    }
}
exports.KnowledgeService = KnowledgeService;
//# sourceMappingURL=KnowledgeService.js.map