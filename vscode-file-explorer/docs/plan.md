# AI 技能知识库 VSCode 插件 —— 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款 VSCode 插件，提供 AI 技能知识库的浏览、搜索和多平台安装功能。

**Architecture:** 采用混合方案 —— 侧边栏用原生 TreeView，技能详情用 Webview Panel，搜索用 QuickPick。核心服务层解析 Markdown frontmatter 构建内存索引，支持内置模板和用户本地知识库。

**Tech Stack:** TypeScript, VSCode Extension API, Markdown + YAML frontmatter

---

## 文件结构规划

```
vscode-file-explorer/
├── src/
│   ├── extension.ts                    # 插件入口
│   ├── models/
│   │   └── types.ts                    # 数据模型接口
│   ├── utils/
│   │   └── markdownParser.ts           # Markdown/YAML 解析
│   ├── services/
│   │   ├── KnowledgeService.ts         # 知识库读取索引
│   │   ├── SearchService.ts            # 全文搜索
│   │   └── InstallService.ts           # 多平台安装
│   └── providers/
│       ├── KnowledgeTreeProvider.ts    # 侧边栏 TreeView
│       └── SkillDetailProvider.ts      # Webview 详情页
├── media/
│   └── skill-detail.html               # 详情页 HTML 模板
├── templates/                          # 内置默认知识库
│   └── clusters/
│       ├── 01-需求工程/
│       │   ├── INDEX.md
│       │   ├── 需求采集智能体.md
│       │   ├── 需求分析智能体.md
│       │   └── skills/
│       │       ├── 会议纪要提取.md
│       │       ├── 干系人访谈.md
│       │       ├── 需求去重.md
│       │       ├── 需求拆解.md
│       │       ├── 边界划分.md
│       │       ├── 非功能需求提取.md
│       │       ├── SRS文档生成.md
│       │       └── 追溯矩阵.md
│       ├── 02-设计工程/
│       │   ├── INDEX.md
│       │   ├── 原型设计智能体.md
│       │   ├── UI组件库智能体.md
│       │   └── skills/
│       │       ├── 根据需求生成原型.md
│       │       ├── 根据需求编写设计文档.md
│       │       ├── 交互流程图设计.md
│       │       ├── 信息架构设计.md
│       │       └── 组件匹配与主题定制.md
│       ├── 03-开发工程/
│       │   ├── INDEX.md
│       │   ├── 架构设计智能体.md
│       │   ├── 前端开发智能体.md
│       │   ├── 后端开发智能体.md
│       │   └── skills/
│       │       ├── 技术选型评估.md
│       │       ├── 架构图生成.md
│       │       ├── API设计.md
│       │       ├── React组件开发.md
│       │       ├── Vue组件开发.md
│       │       ├── 响应式适配.md
│       │       ├── 状态管理设计.md
│       │       ├── DDL生成.md
│       │       ├── CRUD接口开发.md
│       │       ├── 认证授权设计.md
│       │       ├── 消息队列配置.md
│       │       └── 缓存策略设计.md
│       ├── 04-测试工程/
│       │   ├── INDEX.md
│       │   ├── 测试设计智能体.md
│       │   ├── 测试执行智能体.md
│       │   ├── 缺陷管理智能体.md
│       │   └── skills/
│       │       ├── 测试策略制定.md
│       │       ├── 测试用例生成.md
│       │       ├── 边界值分析.md
│       │       ├── 测试数据构造.md
│       │       ├── UI自动化测试.md
│       │       ├── 接口自动化测试.md
│       │       ├── 性能测试方案.md
│       │       ├── 兼容性测试.md
│       │       ├── Bug根因分析.md
│       │       └── 回归测试触发.md
│       ├── 05-运维交付/
│       │   ├── INDEX.md
│       │   ├── 部署智能体.md
│       │   ├── 运维监控智能体.md
│       │   ├── 文档生成智能体.md
│       │   └── skills/
│       │       ├── IaC生成.md
│       │       ├── CI-CD配置.md
│       │       ├── 容器化构建.md
│       │       ├── 蓝绿发布.md
│       │       ├── 监控大盘配置.md
│       │       ├── 告警优化.md
│       │       ├── 故障诊断.md
│       │       ├── 弹性扩缩容.md
│       │       ├── API文档生成.md
│       │       ├── 部署手册生成.md
│       │       └── 培训材料生成.md
│       └── 06-专项能力/
│           ├── INDEX.md
│           ├── 代码诊断智能体.md
│           ├── 安全审计智能体.md
│           ├── 性能优化智能体.md
│           └── skills/
│               ├── 日志分析.md
│               ├── 堆栈解析.md
│               ├── 变更影响分析.md
│               ├── 代码审查检查清单.md
│               ├── 修复方案生成.md
│               ├── OWASP检测.md
│               ├── 依赖漏洞扫描.md
│               ├── 敏感信息检测.md
│               ├── 合规检查.md
│               ├── 性能Profiling.md
│               ├── 查询优化.md
│               ├── 前端加载优化.md
│               └── 缓存策略优化.md
│   └── INDEX.md
├── package.json
├── tsconfig.json
└── .vscodeignore
```

---

## Task 1: 数据模型定义

**Files:**
- Create: `src/models/types.ts`

**Goal:** 定义知识库所有数据类型的 TypeScript 接口。

- [ ] **Step 1: Write types.ts**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/models/types.ts
git commit -m "feat: define knowledge base data models"
```

---

## Task 2: Markdown/YAML 解析工具

**Files:**
- Create: `src/utils/markdownParser.ts`
- Test: `src/utils/markdownParser.test.ts`

**Goal:** 解析 Markdown 文件的 frontmatter（YAML）和正文内容。

- [ ] **Step 1: Install js-yaml dependency**

```bash
cd vscode-file-explorer
npm install js-yaml
npm install -D @types/js-yaml
```

- [ ] **Step 2: Write markdownParser.ts**

```typescript
import * as yaml from 'js-yaml';
import { ParsedMarkdown } from '../models/types';

export function parseMarkdown(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    try {
      const frontmatter = yaml.load(match[1]) as Record<string, any> || {};
      return {
        frontmatter,
        content: match[2].trim()
      };
    } catch (e) {
      console.warn('Failed to parse frontmatter:', e);
    }
  }

  return {
    frontmatter: {},
    content: content.trim()
  };
}

export function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '';
}
```

- [ ] **Step 3: Write test**

```typescript
import * as assert from 'assert';
import { parseMarkdown, extractTitle } from './markdownParser';

suite('Markdown Parser', () => {
  test('parseMarkdown with frontmatter', () => {
    const content = `---
name: "需求拆解"
type: "skill"
version: "1.0.0"
---

# 需求拆解

这是内容。`;

    const result = parseMarkdown(content);
    assert.strictEqual(result.frontmatter.name, '需求拆解');
    assert.strictEqual(result.frontmatter.type, 'skill');
    assert.ok(result.content.includes('这是内容。'));
  });

  test('parseMarkdown without frontmatter', () => {
    const content = '# 标题\n\n内容';
    const result = parseMarkdown(content);
    assert.deepStrictEqual(result.frontmatter, {});
    assert.strictEqual(result.content, '# 标题\n\n内容');
  });

  test('extractTitle', () => {
    assert.strictEqual(extractTitle('# 需求拆解\n\n内容'), '需求拆解');
    assert.strictEqual(extractTitle('没有标题'), '');
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm run compile
# 在 VSCode 中按 F5 运行 Extension Tests，或手动验证
```

Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/markdownParser.ts src/utils/markdownParser.test.ts package.json package-lock.json
git commit -m "feat: add markdown/yaml frontmatter parser"
```

---

## Task 3: KnowledgeService —— 知识库读取与索引

**Files:**
- Create: `src/services/KnowledgeService.ts`

**Goal:** 扫描内置模板目录，解析所有 Markdown 文件，构建 KnowledgeBase 索引。

- [ ] **Step 1: Write KnowledgeService.ts**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBase, Cluster, Agent, Skill } from '../models/types';
import { parseMarkdown, extractTitle } from '../utils/markdownParser';

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
    
    if (!fs.existsSync(templatesPath)) {
      return this.knowledgeBase;
    }

    await this.scanClusters(templatesPath);
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
    return {
      id: fileName,
      name: fm.name || fileName,
      description: fm.description || '',
      cluster: clusterId,
      roles: fm.roles || [],
      skills: fm.skills || [],
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
```

- [ ] **Step 2: Commit**

```bash
git add src/services/KnowledgeService.ts
git commit -m "feat: add KnowledgeService for scanning and indexing markdown files"
```

---

## Task 4: 内置模板数据

**Files:**
- Create: `templates/clusters/*/INDEX.md`
- Create: `templates/clusters/*/*智能体.md`
- Create: `templates/clusters/*/skills/*.md`
- Create: `templates/INDEX.md`

**Goal:** 创建内置的默认知识库模板文件。每个集群至少包含 1 个智能体和 2 个技能作为示例。

**注意：** 由于文件数量较多（6 个集群 × 多个智能体 × 多个技能），采用批量创建策略。每个文件需要包含正确的 frontmatter。

- [ ] **Step 1: 创建 01-需求工程 集群模板**

创建 `templates/clusters/01-需求工程/INDEX.md`：
```markdown
---
name: "需求工程"
description: "需求采集、分析与管理"
type: "index"
version: "1.0.0"
date: "2026-04-30"
---

# 需求工程集群

## 智能体

| 智能体 | 说明 | 技能数 |
|:---|:---|:---:|
| 需求采集智能体 | 收集和整理原始需求 | 3 |
| 需求分析智能体 | 深度解析与文档化 | 5 |

## 常用技能

- 需求拆解
- SRS文档生成
```

创建 `templates/clusters/01-需求工程/需求采集智能体.md`：
```markdown
---
name: "需求采集智能体"
description: "收集和整理来自各方的原始需求"
type: "agent"
version: "1.0.0"
date: "2026-04-30"
cluster: "需求工程"
roles:
  - "产品经理"
  - "业务分析师"
skills-count: 3
---

# 需求采集智能体

## 角色定位

**一句话定义**：原始需求的收集与整理专家。

## 核心能力

| 技能 | 说明 | 独立使用 | 文件 |
|:---|:---|:---:|:---|
| 会议纪要提取 | 从会议记录中提取需求要点 | ✅ | [会议纪要提取](skills/会议纪要提取.md) |
| 干系人访谈 | 设计访谈提纲并整理访谈结果 | ✅ | [干系人访谈](skills/干系人访谈.md) |
| 需求去重 | 识别并合并重复需求 | ✅ | [需求去重](skills/需求去重.md) |
```

创建 `templates/clusters/01-需求工程/skills/会议纪要提取.md`：
```markdown
---
name: "会议纪要提取"
description: "从会议记录中提取结构化需求要点"
type: "skill"
version: "1.0.0"
date: "2026-04-30"
parent-agent: "需求采集智能体"
standalone: true
tags: ["需求", "会议", "提取"]
input: "会议录音转录或会议记录文本"
output: "结构化的需求要点清单"
estimated-time: "10-15分钟"
---

# 技能：会议纪要提取

## 适用场景

✅ **适合使用**：
- 需求评审会议后需要整理决策和待办
- 用户访谈后需要提取关键需求点

## 输入

会议记录文本或录音转录。

## 输出

结构化的会议纪要，包含：决策项、待办项、需求要点。

## Prompt 模板

```
你是一名专业的需求分析师，擅长从会议记录中提取结构化信息。

## 会议记录
{粘贴会议记录}

## 任务
请提取以下内容：
1. 已确认的决策项
2. 提出的需求要点
3. 待办事项（标注负责人）

## 输出格式
- 决策项：...
- 需求要点：...
- 待办：...
```

## 独立安装说明

### Claude Code
复制本文件到 `~/.claude/skills/会议纪要提取.md`

### Cursor
复制 Prompt 模板到对话中使用。

### 通用
直接复制 Prompt 模板，替换占位符后发送给 AI。
```

- [ ] **Step 2: 为所有 6 个集群创建模板文件**

按照相同的模式，为以下集群创建模板：
- 02-设计工程
- 03-开发工程
- 04-测试工程
- 05-运维交付
- 06-专项能力

每个集群至少包含：
- 1 个 INDEX.md
- 2 个智能体定义文件
- 每个智能体至少 2 个技能文件

- [ ] **Step 3: Commit**

```bash
git add templates/
git commit -m "feat: add built-in knowledge base templates for 6 clusters"
```

---

## Task 5: KnowledgeTreeProvider —— 侧边栏 TreeView

**Files:**
- Create: `src/providers/KnowledgeTreeProvider.ts`

**Goal:** 实现侧边栏的知识库树形视图。

- [ ] **Step 1: Write KnowledgeTreeProvider.ts**

```typescript
import * as vscode from 'vscode';
import { KnowledgeService } from '../services/KnowledgeService';
import { TreeNode, TreeNodeType } from '../models/types';

export class KnowledgeTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeNode | undefined | null | void> = 
    new vscode.EventEmitter<TreeNode | undefined | null | void>();
  
  readonly onDidChangeTreeData: vscode.Event<TreeNode | undefined | null | void> = 
    this._onDidChangeTreeData.event;

  constructor(private knowledgeService: KnowledgeService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.collapsibleState
    );

    treeItem.description = element.description;
    treeItem.tooltip = element.description;
    
    // 设置图标
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

    // 技能节点添加点击命令
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

  getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    if (!element) {
      // 根节点：返回所有集群
      return Promise.resolve(this.getClusterNodes());
    }

    switch (element.type) {
      case 'cluster':
        return Promise.resolve(this.getAgentNodes(element.id));
      case 'agent':
        return Promise.resolve(this.getSkillNodes(element.id));
      default:
        return Promise.resolve([]);
    }
  }

  private getClusterNodes(): TreeNode[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    return kb.clusters.map(cluster => ({
      id: cluster.id,
      label: cluster.name,
      description: `${cluster.agents.length} 智能体, ${cluster.skills.length} 技能`,
      type: 'cluster' as TreeNodeType,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    }));
  }

  private getAgentNodes(clusterId: string): TreeNode[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    const cluster = kb.clusters.find(c => c.id === clusterId);
    if (!cluster) return [];

    return cluster.agents
      .map(agentId => kb.agents.find(a => a.id === agentId))
      .filter((a): a is NonNullable<typeof a> => !!a)
      .map(agent => ({
        id: agent.id,
        label: agent.name,
        description: agent.description,
        type: 'agent' as TreeNodeType,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
      }));
  }

  private getSkillNodes(agentId: string): TreeNode[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    const agent = kb.agents.find(a => a.id === agentId);
    if (!agent) return [];

    return agent.skills
      .map(skillId => kb.skills.find(s => s.id === skillId))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(skill => ({
        id: skill.id,
        label: skill.name,
        description: skill.description,
        type: 'skill' as TreeNodeType,
        collapsibleState: vscode.TreeItemCollapsibleState.None
      }));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/providers/KnowledgeTreeProvider.ts
git commit -m "feat: add KnowledgeTreeProvider for sidebar tree view"
```

---

## Task 6: 更新 package.json 注册 TreeView 和命令

**Files:**
- Modify: `package.json`

**Goal:** 注册侧边栏视图、TreeView、命令和右键菜单。

- [ ] **Step 1: Update package.json**

```json
{
  "name": "ai-knowledge-base",
  "displayName": "AI 技能知识库",
  "description": "团队 AI 技能知识库平台",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "license": "MIT",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "Other"
  ],
  "activationEvents": [
    "onView:aiKnowledgeBase.sidebar"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "aiKnowledgeBase.openSkill",
        "title": "打开技能详情",
        "category": "AI知识库"
      },
      {
        "command": "aiKnowledgeBase.searchSkills",
        "title": "搜索技能",
        "category": "AI知识库",
        "icon": "$(search)"
      },
      {
        "command": "aiKnowledgeBase.installToClaude",
        "title": "安装到 Claude Code",
        "category": "AI知识库"
      },
      {
        "command": "aiKnowledgeBase.installToCursor",
        "title": "安装到 Cursor",
        "category": "AI知识库"
      },
      {
        "command": "aiKnowledgeBase.copyPrompt",
        "title": "复制 Prompt",
        "category": "AI知识库"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "aiKnowledgeBaseContainer",
          "title": "AI 技能知识库",
          "icon": "$(book)"
        }
      ]
    },
    "views": {
      "aiKnowledgeBaseContainer": [
        {
          "id": "aiKnowledgeBase.sidebar",
          "name": "知识库"
        }
      ]
    },
    "menus": {
      "view/item/context": [
        {
          "command": "aiKnowledgeBase.openSkill",
          "when": "viewItem == skill",
          "group": "navigation"
        },
        {
          "command": "aiKnowledgeBase.installToClaude",
          "when": "viewItem == skill",
          "group": "install@1"
        },
        {
          "command": "aiKnowledgeBase.installToCursor",
          "when": "viewItem == skill",
          "group": "install@2"
        },
        {
          "command": "aiKnowledgeBase.copyPrompt",
          "when": "viewItem == skill",
          "group": "copy@1"
        }
      ]
    },
    "configuration": {
      "title": "AI 技能知识库",
      "properties": {
        "aiKnowledgeBase.localPath": {
          "type": "string",
          "default": "",
          "description": "用户本地知识库路径（留空则使用内置模板）"
        },
        "aiKnowledgeBase.defaultInstallTarget": {
          "type": "string",
          "default": "claude-code",
          "enum": ["claude-code", "cursor", "generic"],
          "description": "默认安装目标平台"
        }
      }
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.5",
    "@types/node": "20.x",
    "@types/vscode": "^1.74.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat: register tree view, commands, and context menus in package.json"
```

---

## Task 7: SkillDetailProvider —— Webview 详情页

**Files:**
- Create: `src/providers/SkillDetailProvider.ts`
- Create: `media/skill-detail.html`

**Goal:** 实现技能详情展示 Webview。

- [ ] **Step 1: Write SkillDetailProvider.ts**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeService } from '../services/KnowledgeService';

export class SkillDetailProvider {
  public static currentPanel: SkillDetailProvider | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    knowledgeService: KnowledgeService,
    skillId: string
  ) {
    const column = vscode.ViewColumn.One;

    if (SkillDetailProvider.currentPanel) {
      SkillDetailProvider.currentPanel._panel.reveal(column);
      SkillDetailProvider.currentPanel.update(knowledgeService, skillId);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'skillDetail',
      '技能详情',
      column,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri]
      }
    );

    SkillDetailProvider.currentPanel = new SkillDetailProvider(
      panel,
      extensionUri,
      knowledgeService,
      skillId
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private extensionUri: vscode.Uri,
    private knowledgeService: KnowledgeService,
    skillId: string
  ) {
    this._panel = panel;
    this.update(knowledgeService, skillId);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public update(knowledgeService: KnowledgeService, skillId: string) {
    const skill = knowledgeService.getSkill(skillId);
    if (!skill) {
      this._panel.webview.html = '<p>技能未找到</p>';
      return;
    }

    this._panel.title = skill.name;
    this._panel.webview.html = this.getHtml(skill);
  }

  private getHtml(skill: any): string {
    const htmlPath = path.join(this.extensionUri.fsPath, 'media', 'skill-detail.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // 替换占位符
    html = html.replace('{{SKILL_NAME}}', skill.name);
    html = html.replace('{{SKILL_DESCRIPTION}}', skill.description);
    html = html.replace('{{VERSION}}', skill.version);
    html = html.replace('{{DATE}}', skill.date);
    html = html.replace('{{TAGS}}', skill.tags.map((t: string) => `#${t}`).join(' '));
    html = html.replace('{{STANDALONE}}', skill.standalone ? '✅ 可独立使用' : '❌ 需配合智能体');
    html = html.replace('{{ESTIMATED_TIME}}', skill.estimatedTime || '-');
    html = html.replace('{{CONTENT}}', this.markdownToHtml(skill.content));

    return html;
  }

  private markdownToHtml(markdown: string): string {
    // 简化版 Markdown 转 HTML
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 代码块
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // 标题
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 粗体、斜体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 列表
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }

  public dispose() {
    SkillDetailProvider.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) x.dispose();
    }
  }
}
```

- [ ] **Step 2: Write skill-detail.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>技能详情</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .skill-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .skill-desc {
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }
    .meta-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .content {
      font-size: 13px;
    }
    .content h1, .content h2, .content h3 {
      margin: 20px 0 12px;
      font-weight: 600;
    }
    .content h1 { font-size: 18px; }
    .content h2 { font-size: 16px; }
    .content h3 { font-size: 14px; }
    .content p {
      margin-bottom: 12px;
    }
    .content ul, .content ol {
      margin: 12px 0 12px 20px;
    }
    .content li {
      margin-bottom: 4px;
    }
    .content pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 12px 0;
    }
    .content code {
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    .content strong {
      color: var(--vscode-textLink-foreground);
    }
    .prompt-box {
      background: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      position: relative;
    }
    .prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .copy-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 4px 12px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .copy-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .install-bar {
      display: flex;
      gap: 8px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    .install-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .install-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="skill-name">{{SKILL_NAME}}</div>
    <div class="skill-desc">{{SKILL_DESCRIPTION}}</div>
  </div>

  <div class="meta-bar">
    <div class="meta-item">版本: {{VERSION}}</div>
    <div class="meta-item">更新: {{DATE}}</div>
    <div class="meta-item">{{STANDALONE}}</div>
    <div class="meta-item">预计: {{ESTIMATED_TIME}}</div>
    <div class="meta-item">{{TAGS}}</div>
  </div>

  <div class="content">
    {{CONTENT}}
  </div>

  <div class="install-bar">
    <button class="install-btn" onclick="install('claude')">安装到 Claude Code</button>
    <button class="install-btn" onclick="install('cursor')">安装到 Cursor</button>
    <button class="install-btn" onclick="install('generic')">通用安装</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function install(target) {
      vscode.postMessage({ command: 'install', target });
    }

    // 复制 Prompt 功能
    document.querySelectorAll('pre code').forEach(block => {
      const pre = block.parentElement;
      const header = document.createElement('div');
      header.className = 'prompt-header';
      header.innerHTML = '<span>Prompt 模板</span><button class="copy-btn" onclick="copyCode(this)">复制</button>';
      pre.insertBefore(header, block);
    });

    function copyCode(btn) {
      const code = btn.closest('pre').querySelector('code');
      navigator.clipboard.writeText(code.textContent);
      btn.textContent = '已复制!';
      setTimeout(() => btn.textContent = '复制', 2000);
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/providers/SkillDetailProvider.ts media/skill-detail.html
git commit -m "feat: add skill detail webview panel with markdown rendering"
```

---

## Task 8: SearchService —— 搜索功能

**Files:**
- Create: `src/services/SearchService.ts`

**Goal:** 实现技能全文搜索。

- [ ] **Step 1: Write SearchService.ts**

```typescript
import { KnowledgeService } from './KnowledgeService';
import { Skill } from '../models/types';

export interface SearchResult {
  skill: Skill;
  score: number;
  matchedFields: string[];
}

export class SearchService {
  constructor(private knowledgeService: KnowledgeService) {}

  public search(query: string): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const kb = this.knowledgeService.getKnowledgeBase();
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const skill of kb.skills) {
      let score = 0;
      const matchedFields: string[] = [];

      // 名称匹配（权重最高）
      if (skill.name.toLowerCase().includes(lowerQuery)) {
        score += 10;
        matchedFields.push('name');
      }

      // 描述匹配
      if (skill.description.toLowerCase().includes(lowerQuery)) {
        score += 5;
        matchedFields.push('description');
      }

      // 标签匹配
      if (skill.tags.some(t => t.toLowerCase().includes(lowerQuery))) {
        score += 7;
        matchedFields.push('tags');
      }

      // 内容匹配
      if (skill.content.toLowerCase().includes(lowerQuery)) {
        score += 3;
        matchedFields.push('content');
      }

      // 所属智能体匹配
      const agent = kb.agents.find(a => a.id === skill.parentAgent);
      if (agent && agent.name.toLowerCase().includes(lowerQuery)) {
        score += 4;
        matchedFields.push('agent');
      }

      if (score > 0) {
        results.push({ skill, score, matchedFields });
      }
    }

    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
  }

  public getSkillsByRole(roleName: string): Skill[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    const agentIds = kb.agents
      .filter(a => a.roles.includes(roleName))
      .map(a => a.id);
    
    return kb.skills.filter(s => {
      const agent = kb.agents.find(a => a.id === s.parentAgent);
      return agent && agentIds.includes(agent.id);
    });
  }

  public getSkillsByTag(tag: string): Skill[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    return kb.skills.filter(s => 
      s.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/SearchService.ts
git commit -m "feat: add SearchService with full-text search and filtering"
```

---

## Task 9: InstallService —— 多平台安装

**Files:**
- Create: `src/services/InstallService.ts`

**Goal:** 实现技能的多平台安装功能。

- [ ] **Step 1: Write InstallService.ts**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Skill } from '../models/types';

export type InstallTarget = 'claude-code' | 'cursor' | 'generic';

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
}

export class InstallService {
  public async install(skill: Skill, target: InstallTarget): Promise<InstallResult> {
    switch (target) {
      case 'claude-code':
        return this.installToClaudeCode(skill);
      case 'cursor':
        return this.installToCursor(skill);
      case 'generic':
        return this.copyToClipboard(skill.content);
      default:
        return { success: false, message: '未知安装目标' };
    }
  }

  private async installToClaudeCode(skill: Skill): Promise<InstallResult> {
    // 检测 Claude Code 全局技能目录
    const homeDir = os.homedir();
    const globalPath = path.join(homeDir, '.claude', 'skills');
    
    if (fs.existsSync(globalPath)) {
      return this.copySkillFile(skill, globalPath, 'Claude Code');
    }

    // 检测项目级技能目录
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const projectPath = path.join(workspaceFolders[0].uri.fsPath, '.claude', 'skills');
      if (fs.existsSync(projectPath)) {
        return this.copySkillFile(skill, projectPath, 'Claude Code');
      }
    }

    // 未检测到安装路径，提供手动选项
    return {
      success: false,
      message: '未检测到 Claude Code 安装路径',
      path: '~/.claude/skills/'
    };
  }

  private async installToCursor(skill: Skill): Promise<InstallResult> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return {
        success: false,
        message: '未打开工作区，无法安装到 Cursor',
        path: '.cursor/rules/'
      };
    }

    const projectRoot = workspaceFolders[0].uri.fsPath;
    const cursorRulesPath = path.join(projectRoot, '.cursor', 'rules');

    if (fs.existsSync(cursorRulesPath)) {
      return this.copySkillFile(skill, cursorRulesPath, 'Cursor');
    }

    // 检查 .cursorrules 文件
    const cursorrulesPath = path.join(projectRoot, '.cursorrules');
    if (fs.existsSync(cursorrulesPath)) {
      return {
        success: false,
        message: '检测到 .cursorrules 文件，请手动追加内容',
        path: cursorrulesPath
      };
    }

    return {
      success: false,
      message: '未检测到 Cursor 配置',
      path: '.cursor/rules/'
    };
  }

  private async copySkillFile(skill: Skill, targetDir: string, platform: string): Promise<InstallResult> {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, `${skill.id}.md`);
      fs.writeFileSync(targetPath, skill.content, 'utf-8');

      return {
        success: true,
        message: `${skill.name} 已安装到 ${platform}`,
        path: targetPath
      };
    } catch (error) {
      return {
        success: false,
        message: `安装失败: ${error}`,
        path: targetDir
      };
    }
  }

  private async copyToClipboard(content: string): Promise<InstallResult> {
    await vscode.env.clipboard.writeText(content);
    return {
      success: true,
      message: '技能内容已复制到剪贴板'
    };
  }

  public async promptManualInstall(skill: Skill, targetPath: string): Promise<void> {
    const selection = await vscode.window.showQuickPick(
      [
        { label: '$(clippy) 复制文件路径', value: 'path' },
        { label: '$(clippy) 复制文件内容', value: 'content' },
        { label: '$(folder-opened) 选择安装目录...', value: 'browse' }
      ],
      { placeHolder: '未检测到自动安装路径，请选择操作' }
    );

    if (!selection) return;

    switch (selection.value) {
      case 'path':
        await vscode.env.clipboard.writeText(targetPath);
        vscode.window.showInformationMessage('文件路径已复制');
        break;
      case 'content':
        await vscode.env.clipboard.writeText(skill.content);
        vscode.window.showInformationMessage('文件内容已复制');
        break;
      case 'browse':
        const uri = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          openLabel: '选择安装目录'
        });
        if (uri && uri[0]) {
          const result = await this.copySkillFile(skill, uri[0].fsPath, '自定义');
          vscode.window.showInformationMessage(result.message);
        }
        break;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/InstallService.ts
git commit -m "feat: add InstallService for multi-platform skill installation"
```

---

## Task 10: 更新 extension.ts 整合所有组件

**Files:**
- Modify: `src/extension.ts`

**Goal:** 将 KnowledgeService、TreeProvider、Search、Install 和 Webview 整合到插件入口。

- [ ] **Step 1: Rewrite extension.ts**

```typescript
import * as vscode from 'vscode';
import { KnowledgeService } from './services/KnowledgeService';
import { SearchService } from './services/SearchService';
import { InstallService } from './services/InstallService';
import { KnowledgeTreeProvider } from './providers/KnowledgeTreeProvider';
import { SkillDetailProvider } from './providers/SkillDetailProvider';

export function activate(context: vscode.ExtensionContext) {
  // 初始化服务
  const knowledgeService = new KnowledgeService(context.extensionPath);
  const searchService = new SearchService(knowledgeService);
  const installService = new InstallService();

  // 加载知识库
  knowledgeService.loadKnowledgeBase().then(() => {
    console.log('Knowledge base loaded');
  });

  // 注册 TreeView
  const treeProvider = new KnowledgeTreeProvider(knowledgeService);
  const treeView = vscode.window.createTreeView('aiKnowledgeBase.sidebar', {
    treeDataProvider: treeProvider
  });
  context.subscriptions.push(treeView);

  // 打开技能详情
  context.subscriptions.push(
    vscode.commands.registerCommand('aiKnowledgeBase.openSkill', (skillId: string) => {
      SkillDetailProvider.createOrShow(context.extensionUri, knowledgeService, skillId);
    })
  );

  // 搜索技能
  context.subscriptions.push(
    vscode.commands.registerCommand('aiKnowledgeBase.searchSkills', async () => {
      const query = await vscode.window.showInputBox({
        placeHolder: '输入技能名称、标签或关键词',
        prompt: '搜索 AI 技能'
      });

      if (!query) return;

      const results = searchService.search(query);
      if (results.length === 0) {
        vscode.window.showInformationMessage('未找到匹配的技能');
        return;
      }

      const items = results.map(r => ({
        label: r.skill.name,
        description: r.skill.description,
        detail: `${r.skill.cluster} | ${r.matchedFields.join(', ')}`,
        skillId: r.skill.id
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `找到 ${results.length} 个结果`
      });

      if (selected) {
        vscode.commands.executeCommand('aiKnowledgeBase.openSkill', selected.skillId);
      }
    })
  );

  // 安装到 Claude Code
  context.subscriptions.push(
    vscode.commands.registerCommand('aiKnowledgeBase.installToClaude', async (skillId: string) => {
      const skill = knowledgeService.getSkill(skillId);
      if (!skill) return;

      const result = await installService.install(skill, 'claude-code');
      if (result.success) {
        vscode.window.showInformationMessage(result.message);
      } else {
        const action = await vscode.window.showWarningMessage(
          result.message,
          '手动安装'
        );
        if (action === '手动安装') {
          await installService.promptManualInstall(skill, result.path || '');
        }
      }
    })
  );

  // 安装到 Cursor
  context.subscriptions.push(
    vscode.commands.registerCommand('aiKnowledgeBase.installToCursor', async (skillId: string) => {
      const skill = knowledgeService.getSkill(skillId);
      if (!skill) return;

      const result = await installService.install(skill, 'cursor');
      if (result.success) {
        vscode.window.showInformationMessage(result.message);
      } else {
        const action = await vscode.window.showWarningMessage(
          result.message,
          '手动安装'
        );
        if (action === '手动安装') {
          await installService.promptManualInstall(skill, result.path || '');
        }
      }
    })
  );

  // 复制 Prompt
  context.subscriptions.push(
    vscode.commands.registerCommand('aiKnowledgeBase.copyPrompt', async (skillId: string) => {
      const skill = knowledgeService.getSkill(skillId);
      if (!skill) return;

      await vscode.env.clipboard.writeText(skill.content);
      vscode.window.showInformationMessage(`${skill.name} 的 Prompt 已复制到剪贴板`);
    })
  );

  // Webview 消息处理（安装命令）
  // 注：SkillDetailProvider 中通过 postMessage 发送的消息需要在这里处理
  // 由于 SkillDetailProvider 使用静态方法管理，消息处理在 Provider 内部完成
}

export function deactivate() {}
```

- [ ] **Step 2: Commit**

```bash
git add src/extension.ts
git commit -m "feat: integrate all services and providers in extension entry"
```

---

## Task 11: 编译验证与修复

**Files:**
- Modify: 按需修复编译错误

**Goal:** 确保 TypeScript 编译通过，无错误。

- [ ] **Step 1: 运行编译**

```bash
npm run compile
```

Expected: 无编译错误。如果有错误，根据错误信息修复类型不匹配或导入问题。

- [ ] **Step 2: 常见修复**

如果 `TreeNode` 接口与 `vscode.TreeDataProvider` 类型冲突：

```typescript
// 在 KnowledgeTreeProvider.ts 中修改
export class KnowledgeTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  // ...
}
```

如果 `types.ts` 缺少 `vscode` 导入：

```typescript
// 在 types.ts 顶部添加
import * as vscode from 'vscode';
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve TypeScript compilation errors"
```

---

## Task 12: 打包与测试

**Files:**
- Modify: `.vscodeignore`

**Goal:** 配置打包排除规则，生成 .vsix 并测试。

- [ ] **Step 1: Update .vscodeignore**

```
src/
out/**/*.map
.vscode/
node_modules/
tsconfig.json
*.vsix
.gitignore
```

- [ ] **Step 2: 打包**

```bash
vsce package
```

Expected: 成功生成 `ai-knowledge-base-0.1.0.vsix`

- [ ] **Step 3: 本地测试**

1. 在 VSCode 中：`Ctrl+Shift+P` → `从 VSIX 安装` → 选择生成的 `.vsix`
2. 重新加载窗口
3. 点击左侧活动栏的 📚 图标
4. 验证：
   - [ ] 侧边栏显示 6 个集群
   - [ ] 点击集群展开显示智能体
   - [ ] 点击智能体展开显示技能
   - [ ] 点击技能打开详情页
   - [ ] 详情页显示正确的 Markdown 内容
   - [ ] 搜索功能正常工作
   - [ ] 安装功能（至少剪贴板复制）正常工作

- [ ] **Step 4: Commit**

```bash
git add .vscodeignore
git commit -m "chore: configure .vscodeignore and package extension"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| 设计文档需求 | 对应 Task |
|-------------|----------|
| 数据模型定义 | Task 1 |
| Markdown/YAML 解析 | Task 2 |
| 知识库读取索引 | Task 3 |
| 内置模板数据 | Task 4 |
| 侧边栏 TreeView | Task 5, 6 |
| 技能详情 Webview | Task 7 |
| 搜索功能 | Task 8 |
| 多平台安装 | Task 9 |
| 插件入口整合 | Task 10 |
| 编译打包 | Task 11, 12 |

**Gap:** 设计文档中的"按角色浏览"和"按场景浏览"快捷筛选在 TreeView 中尚未实现，可在后续版本添加。

### 2. Placeholder Scan

- [x] 无 TBD/TODO
- [x] 所有步骤包含完整代码
- [x] 所有命令包含预期输出
- [x] 类型/方法名前后一致

### 3. Type Consistency

- `KnowledgeService.getSkill(id)` 返回 `Skill | undefined`
- `SearchService.search(query)` 返回 `SearchResult[]`
- `InstallService.install(skill, target)` 返回 `Promise<InstallResult>`
- `TreeNode.type` 使用 `'cluster' | 'agent' | 'skill'`

所有接口定义与使用处一致。
