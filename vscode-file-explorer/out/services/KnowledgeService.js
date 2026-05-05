"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
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
        this.industryPackages = [];
    }
    async loadKnowledgeBase() {
        const templatesPath = path.join(this.extensionPath, 'templates');
        const clustersPath = path.join(templatesPath, 'clusters');
        if (fs.existsSync(clustersPath)) {
            await this.scanClusters(clustersPath);
        }
        await this.loadIndustryPackages();
        return this.knowledgeBase;
    }
    async loadIndustryPackages() {
        const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
        const packagePaths = config.get('industryPackages', []);
        for (const packagePath of packagePaths) {
            if (!fs.existsSync(packagePath))
                continue;
            const packageJsonPath = path.join(packagePath, 'package.json');
            let packageMeta = {
                name: path.basename(packagePath),
                version: '0.0.0'
            };
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const content = fs.readFileSync(packageJsonPath, 'utf-8');
                    packageMeta = JSON.parse(content);
                }
                catch {
                    // 解析失败时使用默认元数据
                }
            }
            const clustersPath = path.join(packagePath, 'clusters');
            if (!fs.existsSync(clustersPath))
                continue;
            const beforeSkillCount = this.knowledgeBase.skills.length;
            const packageId = packageMeta.name || path.basename(packagePath);
            await this.scanClusters(clustersPath, 'industry', packageId);
            const afterSkillCount = this.knowledgeBase.skills.length;
            this.industryPackages.push({
                id: packageId,
                name: packageMeta.name || packageId,
                version: packageMeta.version || '0.0.0',
                description: packageMeta.description || '',
                path: packagePath,
                clusterCount: 0,
                skillCount: afterSkillCount - beforeSkillCount,
                enabled: true
            });
        }
    }
    async scanClusters(clustersPath, source = 'core', industryPackage) {
        const entries = fs.readdirSync(clustersPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
                await this.scanCluster(path.join(clustersPath, entry.name), entry.name, source, industryPackage);
            }
        }
    }
    async scanCluster(clusterPath, clusterId, source = 'core', industryPackage) {
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
                const skills = await this.scanSkills(path.join(clusterPath, entry.name), clusterId, source, industryPackage);
                cluster.skills.push(...skills.map(s => s.id));
                this.knowledgeBase.skills.push(...skills);
            }
        }
        // 同名集群合并:行业包可向核心集群追加 agent/skill
        const existingIndex = this.knowledgeBase.clusters.findIndex(c => c.id === clusterId);
        if (existingIndex >= 0) {
            this.knowledgeBase.clusters[existingIndex].agents.push(...cluster.agents);
            this.knowledgeBase.clusters[existingIndex].skills.push(...cluster.skills);
        }
        else {
            this.knowledgeBase.clusters.push(cluster);
        }
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
    async scanSkills(skillsPath, clusterId, source = 'core', industryPackage) {
        const skills = [];
        const entries = fs.readdirSync(skillsPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                const skill = await this.parseSkill(path.join(skillsPath, entry.name), clusterId, source, industryPackage);
                if (skill) {
                    skills.push(skill);
                }
            }
        }
        return skills;
    }
    async parseSkill(filePath, clusterId, source = 'core', industryPackage) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = (0, markdownParser_1.parseMarkdown)(content);
        const fm = parsed.frontmatter;
        if (fm.type !== 'skill' && fm.type !== 'checklist') {
            return null;
        }
        const fileName = path.basename(filePath, '.md');
        return {
            id: fileName,
            name: fm.name || fileName,
            description: fm.description || '',
            type: fm.type || 'skill',
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
            content: parsed.content,
            scenarioTags: fm.scenarioTags || [],
            source,
            industryPackage
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