# VS Code 插件 v0.2.0 优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 200 个内部智能体方案的需求洞察，实现双分类导航、行业知识包、检查清单式 Skill、使用统计等核心功能，将插件从 v0.1.1 升级到 v0.2.0。

**Architecture:** 在现有 Dashboard Webview 架构上增量扩展：后端扩展数据模型（Skill 新增 scenarioTags/source/industryPackage/type 字段）和服务层（KnowledgeService 增加行业包加载、RecentService 增加使用统计），前端 Dashboard 增加双分类 Tab 切换、场景浏览视图、检查清单渲染、快速创建入口。

**Tech Stack:** TypeScript / VS Code Extension API / Vanilla JS (IIFE) / CSS Grid + Flexbox

---

## 文件结构规划

```
vscode-file-explorer/
├── src/
│   ├── models/
│   │   └── types.ts                    # MODIFY: 扩展 Skill, 新增 UsageStats/ViewMode/IndustryPackage
│   ├── services/
│   │   ├── KnowledgeService.ts         # MODIFY: scenarioTags 解析, 行业包加载, 扩展层导入
│   │   ├── SearchService.ts            # MODIFY: 按场景标签搜索
│   │   ├── RecentService.ts            # MODIFY: 使用统计追踪
│   │   └── InstallService.ts           # (no change)
│   ├── providers/
│   │   └── DashboardWebviewViewProvider.ts  # MODIFY: 新消息类型处理
│   ├── utils/
│   │   └── markdownParser.ts           # (no change)
│   └── extension.ts                    # (no change)
├── media/
│   ├── dashboard.html                  # (no change)
│   ├── dashboard.css                   # MODIFY: 新组件样式
│   └── dashboard.js                    # MODIFY: 双分类导航, 场景浏览, 检查清单, 快速创建
└── templates/
    └── clusters/                       # MODIFY: 内容重组, 增加 scenarioTags
```

---

## Task 1: 扩展数据模型

**Files:**
- Modify: `src/models/types.ts`

- [ ] **Step 1: 扩展现有 Skill 接口**

修改 `Skill` 接口，增加 `scenarioTags`、`source`、`industryPackage` 字段，并将 `type` 扩展为联合类型：

```typescript
// src/models/types.ts
// 替换现有的 Skill 接口定义

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'skill' | 'checklist';  // 扩展为联合类型
  version: string;
  date: string;
  parentAgent: string;
  cluster: string;
  standalone: boolean;
  tags: string[];
  scenarioTags: string[];         // 新增：场景标签数组
  source: 'core' | 'industry' | 'imported';  // 新增：来源标记
  industryPackage?: string;       // 新增：所属行业包ID
  input?: string;
  output?: string;
  estimatedTime?: string;
  filePath: string;
  content: string;
}
```

- [ ] **Step 2: 新增 UsageStats 和 ViewMode 类型**

在 `src/models/types.ts` 的 `DashboardStats` 接口下方新增：

```typescript
// src/models/types.ts
// 在 DashboardStats 接口之后添加

export interface UsageStats {
  skillUsage: Record<string, number>;      // skillId -> 使用次数
  scenarioUsage: Record<string, number>;   // scenarioTag -> 使用次数
  lastUsed: number;                        // 最后活跃时间戳
}

export type ViewMode = 'role' | 'scenario';

export interface IndustryPackage {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string;
  clusterCount: number;
  skillCount: number;
  enabled: boolean;
}

// 场景定义
export interface Scenario {
  id: string;
  name: string;
  icon: string;
  description: string;
}
```

- [ ] **Step 3: 更新 DashboardStats 接口**

```typescript
// src/models/types.ts
// 替换现有的 DashboardStats

export interface DashboardStats {
  clusterCount: number;
  agentCount: number;
  skillCount: number;
  scenarioCount: number;  // 新增
}
```

- [ ] **Step 4: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无 TypeScript 编译错误（可能有一些使用了 `Skill` 类型的代码需要适配，在后续 Task 中修复）

- [ ] **Step 5: Commit**

```bash
cd vscode-file-explorer
git add src/models/types.ts
git commit -m "feat: extend Skill type with scenarioTags, source, checklist support"
```

---

## Task 2: KnowledgeService 场景标签解析与默认值

**Files:**
- Modify: `src/services/KnowledgeService.ts`

- [ ] **Step 1: 修改 parseSkill 读取 scenarioTags 和 type**

在 `src/services/KnowledgeService.ts` 的 `parseSkill` 方法中，修改返回的 Skill 对象：

```typescript
// src/services/KnowledgeService.ts
// 在 parseSkill 方法中，替换 return 语句

    const fileName = path.basename(filePath, '.md');
    return {
      id: fileName,
      name: fm.name || fileName,
      description: fm.description || '',
      type: fm.type === 'checklist' ? 'checklist' : 'skill',
      version: fm.version || '1.0.0',
      date: fm.date || '',
      parentAgent: fm.parentAgent || '',
      cluster: clusterId,
      standalone: fm.standalone ?? true,
      tags: fm.tags || [],
      scenarioTags: fm.scenarioTags || [],  // 新增
      source: 'core',                        // 核心模板默认标记
      input: fm.input,
      output: fm.output,
      estimatedTime: fm.estimatedTime,
      filePath,
      content: parsed.content
    };
```

- [ ] **Step 2: 为现有核心 Skill 补充 scenarioTags**

修改 `templates/clusters/` 下每个 Skill 文件的 frontmatter，增加 `scenarioTags` 字段。

以 `01-需求工程/skills/会议纪要提取.md` 为例，在 frontmatter 中增加：

```yaml
---
name: 会议纪要提取
description: 从会议录音或聊天记录中提取结构化会议纪要
type: skill
tags: [会议, 文档]
scenarioTags: [写文档, 管项目]  # 新增
---
```

为每个现有 Skill 补充合适的 scenarioTags（从 8 个场景中选择）：写文档、查故障、写代码、搞数据、做设计、管项目、测试质量、知识检索。

- [ ] **Step 3: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无编译错误。`source` 字段的默认值已设置，不会破坏现有代码。

- [ ] **Step 4: Commit**

```bash
cd vscode-file-explorer
git add src/services/KnowledgeService.ts templates/
git commit -m "feat: parse scenarioTags from skill frontmatter, add to core skills"
```

---

## Task 3: RecentService 使用统计

**Files:**
- Modify: `src/services/RecentService.ts`

- [ ] **Step 1: 新增 UsageStats 追踪方法**

在 `src/services/RecentService.ts` 中，添加常量并扩展类：

```typescript
// src/services/RecentService.ts
// 在文件顶部，现有常量之后添加

const USAGE_STATS_KEY = 'aiKnowledgeBase.usageStats';

// 预定义场景列表（用于计算"我的常用场景"）
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
```

- [ ] **Step 2: 在 RecentService 类中增加统计方法**

```typescript
// src/services/RecentService.ts
// 在 RecentService 类中，getStats 方法之后添加

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
    const scenarioCounts = Object.entries(stats.scenarioUsage)
      .map(([id, count]) => {
        const scenario = SCENARIOS.find(s => s.id === id);
        return { id, name: scenario?.name || id, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    return scenarioCounts;
  }
```

- [ ] **Step 3: 修改 getStats 增加 scenarioCount**

```typescript
// src/services/RecentService.ts
// 替换 getStats 方法

  getStats(kb: KnowledgeBase): DashboardStats {
    // 计算唯一场景标签数
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
```

- [ ] **Step 4: 修改 addRecent 同时追踪使用统计**

```typescript
// src/services/RecentService.ts
// 在 addRecent 方法末尾，globalState.update 之后添加

    this.trackSkillUsage(skillId);
```

- [ ] **Step 5: 导入 UsageStats 类型**

确保文件顶部导入了 `UsageStats`：

```typescript
// src/services/RecentService.ts
// 修改导入行

import { RecentItem, DashboardStats, KnowledgeBase, UsageStats } from '../models/types';
```

- [ ] **Step 6: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无编译错误

- [ ] **Step 7: Commit**

```bash
cd vscode-file-explorer
git add src/services/RecentService.ts
git commit -m "feat: add usage stats tracking for skills and scenarios"
```

---

## Task 4: SearchService 场景搜索增强

**Files:**
- Modify: `src/services/SearchService.ts`

- [ ] **Step 1: 在搜索结果中增加场景匹配**

在 `src/services/SearchService.ts` 的 search 方法中，在标签匹配之后、内容匹配之前添加场景标签匹配：

```typescript
// src/services/SearchService.ts
// 在 search 方法的标签匹配代码块之后添加

      // 场景标签匹配
      if (skill.scenarioTags.some(t => t.toLowerCase().includes(lowerQuery))) {
        score += 6;
        matchedFields.push('场景');
      }
```

- [ ] **Step 2: 新增按场景获取 Skill 的方法**

```typescript
// src/services/SearchService.ts
// 在 SearchService 类末尾添加

  public getSkillsByScenario(scenarioId: string): Skill[] {
    const kb = this.knowledgeService.getKnowledgeBase();
    return kb.skills.filter(s =>
      s.scenarioTags.some(t => t.toLowerCase() === scenarioId.toLowerCase())
    );
  }
```

- [ ] **Step 3: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无编译错误

- [ ] **Step 4: Commit**

```bash
cd vscode-file-explorer
git add src/services/SearchService.ts
git commit -m "feat: enhance search with scenario tag matching and getSkillsByScenario"
```

---

## Task 5: DashboardWebviewViewProvider 通信协议扩展

**Files:**
- Modify: `src/providers/DashboardWebviewViewProvider.ts`

- [ ] **Step 1: 扩展前端状态消息**

修改 `_sendInitialData` 方法，增加使用统计和场景数据：

```typescript
// src/providers/DashboardWebviewViewProvider.ts
// 替换 _sendInitialData 方法

  private _sendInitialData() {
    if (!this._view) return;

    const kb = this._knowledgeService.getKnowledgeBase();
    const recent = this._recentService.getRecent();
    const favorites = this._recentService.getFavorites();
    const stats = this._recentService.getStats(kb);
    const usageStats = this._recentService.getUsageStats();
    const topScenarios = this._recentService.getTopScenarios();
    const viewMode = this._recentService.getViewMode();

    this._view.webview.postMessage({
      type: 'init:data',
      data: { clusters: kb.clusters, agents: kb.agents, skills: kb.skills }
    });

    this._view.webview.postMessage({
      type: 'init:state',
      data: { recent, favorites, stats, usageStats, topScenarios, viewMode }
    });
  }
```

- [ ] **Step 2: 在 RecentService 中增加 viewMode 持久化**

在 `src/services/RecentService.ts` 中添加：

```typescript
// src/services/RecentService.ts
// 在常量区域添加

const VIEW_MODE_KEY = 'aiKnowledgeBase.viewMode';

// 在 RecentService 类中添加方法

  getViewMode(): ViewMode {
    return this.context.globalState.get<ViewMode>(VIEW_MODE_KEY, 'role');
  }

  setViewMode(mode: ViewMode): void {
    this.context.globalState.update(VIEW_MODE_KEY, mode);
  }
```

- [ ] **Step 3: 扩展消息处理**

在 `DashboardWebviewViewProvider` 的 `onDidReceiveMessage` switch 中增加新 case：

```typescript
// src/providers/DashboardWebviewViewProvider.ts
// 在 switch 语句中，'save:settings' case 之后添加

          case 'switch:viewMode':
            this._recentService.setViewMode(message.mode);
            break;
          case 'track:scenario':
            this._recentService.trackScenarioUsage(message.scenarioId);
            break;
          case 'get:scenarios':
            this._handleGetScenarios();
            break;
```

- [ ] **Step 4: 增加场景查询处理方法**

```typescript
// src/providers/DashboardWebviewViewProvider.ts
// 在类中添加新方法

  private _handleGetScenarios() {
    const { SCENARIOS } = require('../services/RecentService');
    this._view?.webview.postMessage({
      type: 'scenarios:data',
      data: SCENARIOS
    });
  }
```

更好的方式是不使用 require，而是直接定义：

```typescript
// src/providers/DashboardWebviewViewProvider.ts
// 在文件顶部导入

import { SCENARIOS } from '../services/RecentService';

// 在类中添加方法
  private _handleGetScenarios() {
    this._view?.webview.postMessage({
      type: 'scenarios:data',
      data: SCENARIOS
    });
  }
```

- [ ] **Step 5: 修改 _handleOpenSkill 追踪场景**

```typescript
// src/providers/DashboardWebviewViewProvider.ts
// 修改 _handleOpenSkill

  private async _handleOpenSkill(skillId: string) {
    const skill = this._knowledgeService.getSkill(skillId);
    if (skill && skill.scenarioTags.length > 0) {
      // 追踪第一个场景标签（主场景）
      this._recentService.trackScenarioUsage(skill.scenarioTags[0]);
    }
    this._recentService.addRecent(skillId, this._knowledgeService);
    this._sendInitialData();
  }
```

- [ ] **Step 6: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无编译错误

- [ ] **Step 7: Commit**

```bash
cd vscode-file-explorer
git add src/providers/DashboardWebviewViewProvider.ts src/services/RecentService.ts
git commit -m "feat: extend webview messaging for viewMode, scenario tracking, usage stats"
```

---

## Task 6: 前端 Dashboard 双分类导航

**Files:**
- Modify: `media/dashboard.js`

- [ ] **Step 1: 扩展 state 对象**

```javascript
// media/dashboard.js
// 替换 state 对象定义

  const state = {
    route: '/dashboard',
    data: null,
    recent: [],
    favorites: [],
    stats: {},
    usageStats: { skillUsage: {}, scenarioUsage: {}, lastUsed: 0 },
    topScenarios: [],
    viewMode: 'role',       // 新增：当前浏览模式 'role' | 'scenario'
    scenarios: [],          // 新增：场景定义列表
    settings: {},
    searchResults: [],
    currentClusterId: null,
    currentSkillId: null,
  };
```

- [ ] **Step 2: 扩展消息处理器**

在 `window.addEventListener('message', ...)` 的 switch 中增加：

```javascript
// media/dashboard.js
// 在 switch 中 'init:state' case 之后添加

      case 'init:state':
        state.recent = message.data.recent;
        state.favorites = message.data.favorites;
        state.stats = message.data.stats;
        state.usageStats = message.data.usageStats || { skillUsage: {}, scenarioUsage: {}, lastUsed: 0 };
        state.topScenarios = message.data.topScenarios || [];
        state.viewMode = message.data.viewMode || 'role';
        render();
        break;
      case 'scenarios:data':
        state.scenarios = message.data;
        render();
        break;
```

- [ ] **Step 3: 重写 renderDashboard 函数**

```javascript
// media/dashboard.js
// 替换 renderDashboard 函数

  function renderDashboard() {
    const { clusters, agents, skills } = state.data;
    const recent = state.recent.slice(0, 4);

    return `
      <div class="dashboard-page">
        <div class="logo-section">
          <div class="logo-icon">🤖</div>
          <div class="logo-title">AI Knowledge Base</div>
          <div class="logo-version">v0.2.0</div>
        </div>
        <div class="welcome-section">
          <div class="welcome-title">欢迎来到 AI 技能知识库</div>
          <div class="welcome-desc">沉淀团队 AI 协作最佳实践，让每个人都能高效使用 AI</div>
        </div>
        <div class="search-section">
          <div class="search-box" id="dashboard-search-box">
            <span>🔍</span>
            <input type="text" placeholder="搜索技能、场景或角色..." id="dashboard-search-input">
          </div>
        </div>

        <!-- 双分类 Tab 切换 -->
        <div class="view-mode-tabs">
          <button class="view-mode-btn ${state.viewMode === 'role' ? 'active' : ''}" data-mode="role">
            <span>🏷️</span> 按角色浏览
          </button>
          <button class="view-mode-btn ${state.viewMode === 'scenario' ? 'active' : ''}" data-mode="scenario">
            <span>🎯</span> 按场景浏览
          </button>
        </div>

        <!-- 动态内容区：角色或场景 -->
        <div class="view-mode-content">
          ${state.viewMode === 'role'
            ? renderRoleView(clusters, agents, skills)
            : renderScenarioView(skills)
          }
        </div>

        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${state.stats.clusterCount || clusters.length}</div>
              <div class="stat-label">集群</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${state.stats.agentCount || agents.length}</div>
              <div class="stat-label">智能体</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${state.stats.skillCount || skills.length}</div>
              <div class="stat-label">技能</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${state.stats.scenarioCount || 8}</div>
              <div class="stat-label">场景</div>
            </div>
          </div>
        </div>

        <div class="recent-section">
          <div class="section-header">
            <span class="section-title">🕐 最近使用</span>
            <button class="section-action" data-route="/recent">全部历史</button>
          </div>
          ${recent.length > 0 ? recent.map(r => `
            <div class="list-item" data-skill-id="${r.skillId}">
              <span class="list-icon">📄</span>
              <div class="list-content">
                <div class="list-title">${escapeHtml(r.skillName)}</div>
                <div class="list-meta">${timeAgo(r.timestamp)} · ${escapeHtml(r.agentName)} · ${escapeHtml(r.clusterName)}</div>
              </div>
              <span class="list-arrow">→</span>
            </div>
          `).join('') : '<div style="padding: 12px; color: var(--fg-secondary); font-size: 12px;">暂无使用记录</div>'}
        </div>

        ${renderQuickCreate()}

        ${renderMyTopScenarios()}

        <div class="guide-section">
          <div class="guide-title">🚀 新手上路</div>
          <div class="guide-desc">只需 4 步，开始使用 AI 技能知识库</div>
          <div class="guide-steps">
            <div class="guide-step">
              <span class="step-number">01</span>
              <div class="step-text">
                <div class="step-title">选择浏览模式</div>
                <div class="step-subtitle">按角色或按场景找到技能</div>
              </div>
            </div>
            <div class="guide-step">
              <span class="step-number">02</span>
              <div class="step-text">
                <div class="step-title">选择技能并安装</div>
                <div class="step-subtitle">一键安装到 Claude 或 Cursor</div>
              </div>
            </div>
            <div class="guide-step">
              <span class="step-number">03</span>
              <div class="step-text">
                <div class="step-title">执行工作流</div>
                <div class="step-subtitle">按步骤完成任务</div>
              </div>
            </div>
            <div class="guide-step">
              <span class="step-number">04</span>
              <div class="step-text">
                <div class="step-title">收藏常用技能</div>
                <div class="step-subtitle">建立个人技能库</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
```

- [ ] **Step 4: 新增 renderRoleView 函数**

```javascript
// media/dashboard.js
// 在 renderDashboard 之后添加

  function renderRoleView(clusters, agents, skills) {
    // 开发工程集群永远排第一
    const sortedClusters = [...clusters].sort((a, b) => {
      if (a.id === '01-开发工程') return -1;
      if (b.id === '01-开发工程') return 1;
      return a.id.localeCompare(b.id);
    });

    return `
      <div class="clusters-section">
        <div class="section-header">
          <span class="section-title">📋 选择你的角色，快速开始</span>
        </div>
        <div class="clusters-grid">
          ${sortedClusters.map(c => {
            const clusterAgents = c.agents.map(id => agents.find(a => a.id === id)).filter(Boolean);
            const clusterSkills = c.skills.map(id => skills.find(s => s.id === id)).filter(Boolean);
            return `
              <div class="cluster-card" data-cluster-id="${c.id}">
                <div class="cluster-header">
                  <span class="cluster-icon">⚡</span>
                  <span class="cluster-name">${escapeHtml(c.name)}</span>
                  ${c.id === '01-开发工程' ? '<span class="cluster-badge">核心</span>' : ''}
                </div>
                <div class="cluster-desc">${escapeHtml(c.description)}</div>
                <div class="cluster-footer">
                  <span class="cluster-count">${clusterAgents.length} 个智能体 · ${clusterSkills.length} 个技能</span>
                  <span class="cluster-enter">进入 →</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
```

- [ ] **Step 5: 修改 attachDashboardEvents 增加 Tab 切换**

```javascript
// media/dashboard.js
// 替换 attachDashboardEvents 函数

  function attachDashboardEvents() {
    const searchBox = document.getElementById('dashboard-search-box');
    if (searchBox) searchBox.addEventListener('click', () => navigateTo('/search'));

    // 模式切换 Tab
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        state.viewMode = mode;
        vscode.postMessage({ type: 'switch:viewMode', mode });
        render();
      });
    });

    document.querySelectorAll('.cluster-card').forEach(card => {
      card.addEventListener('click', () => {
        state.currentClusterId = card.dataset.clusterId;
        navigateTo('/cluster');
      });
    });

    document.querySelectorAll('.recent-section .list-item').forEach(item => {
      item.addEventListener('click', () => {
        state.currentSkillId = item.dataset.skillId;
        navigateTo('/skill');
        vscode.postMessage({ type: 'open:skill', skillId: item.dataset.skillId });
      });
    });

    // 场景卡片事件
    document.querySelectorAll('.scenario-card').forEach(card => {
      card.addEventListener('click', () => {
        state.currentScenarioId = card.dataset.scenarioId;
        navigateTo('/scenario');
        vscode.postMessage({ type: 'track:scenario', scenarioId: card.dataset.scenarioId });
      });
    });

    // 快速创建事件
    document.querySelectorAll('.quick-create-card').forEach(card => {
      card.addEventListener('click', () => {
        const action = card.dataset.action;
        showToast('info', `${action} 功能即将推出`);
      });
    });
  }
```

- [ ] **Step 6: Commit**

```bash
cd vscode-file-explorer
git add media/dashboard.js
git commit -m "feat: dashboard dual-view navigation with role and scenario tabs"
```

---

## Task 7: 前端场景浏览、快速创建和常用场景

**Files:**
- Modify: `media/dashboard.js`

- [ ] **Step 1: 新增 renderScenarioView 函数**

```javascript
// media/dashboard.js
// 在 renderRoleView 之后添加

  function renderScenarioView(skills) {
    const scenarios = state.scenarios.length > 0 ? state.scenarios : [
      { id: 'write-doc', name: '写文档', icon: '📝', description: '周报、会议纪要、项目材料、测试报告' },
      { id: 'troubleshoot', name: '查故障', icon: '🔧', description: '排查、巡检、日志分析' },
      { id: 'write-code', name: '写代码', icon: '💻', description: '生成、Review、Bug 定位' },
      { id: 'data-work', name: '搞数据', icon: '🗄️', description: 'SQL、报表、迁移、清理' },
      { id: 'design', name: '做设计', icon: '📐', description: '原型、数模、架构、接口' },
      { id: 'manage-project', name: '管项目', icon: '📊', description: '计划、跟踪、汇报' },
      { id: 'test-quality', name: '测试质量', icon: '✅', description: '用例、审查、验证' },
      { id: 'knowledge', name: '知识检索', icon: '📚', description: '问答、文档整理' }
    ];

    return `
      <div class="scenarios-section">
        <div class="section-header">
          <span class="section-title">💡 你在做什么？选择一个场景开始</span>
        </div>
        <div class="scenarios-grid">
          ${scenarios.map(s => {
            const skillCount = skills.filter(skill =>
              skill.scenarioTags.some(t => t.toLowerCase() === s.id.toLowerCase())
            ).length;
            return `
              <div class="scenario-card" data-scenario-id="${s.id}">
                <div class="scenario-icon">${s.icon}</div>
                <div class="scenario-name">${escapeHtml(s.name)}</div>
                <div class="scenario-desc">${escapeHtml(s.description)}</div>
                <div class="scenario-count">${skillCount} 个技能</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
```

- [ ] **Step 2: 新增 renderQuickCreate 函数**

```javascript
// media/dashboard.js
// 在 renderScenarioView 之后添加

  function renderQuickCreate() {
    return `
      <div class="quick-create-section">
        <div class="section-header">
          <span class="section-title">⚡ 快速创建</span>
        </div>
        <div class="quick-create-grid">
          <div class="quick-create-card" data-action="写周报">
            <div class="quick-create-icon">📝</div>
            <div class="quick-create-name">写周报</div>
            <div class="quick-create-desc">一键生成工作周报</div>
          </div>
          <div class="quick-create-card" data-action="会议纪要">
            <div class="quick-create-icon">📋</div>
            <div class="quick-create-name">会议纪要</div>
            <div class="quick-create-desc">整理会议要点</div>
          </div>
          <div class="quick-create-card" data-action="项目材料">
            <div class="quick-create-icon">📁</div>
            <div class="quick-create-name">项目材料</div>
            <div class="quick-create-desc">生成项目交付文档</div>
          </div>
        </div>
      </div>
    `;
  }
```

- [ ] **Step 3: 新增 renderMyTopScenarios 函数**

```javascript
// media/dashboard.js
// 在 renderQuickCreate 之后添加

  function renderMyTopScenarios() {
    const topScenarios = state.topScenarios || [];
    if (topScenarios.length === 0) {
      return '';
    }

    return `
      <div class="top-scenarios-section">
        <div class="section-header">
          <span class="section-title">🔥 我的常用场景</span>
        </div>
        <div class="top-scenarios-list">
          ${topScenarios.map((s, i) => `
            <div class="top-scenario-item" data-scenario-id="${s.id}">
              <span class="top-scenario-rank">${i + 1}</span>
              <span class="top-scenario-name">${escapeHtml(s.name)}</span>
              <span class="top-scenario-count">${s.count} 次</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
```

- [ ] **Step 4: Commit**

```bash
cd vscode-file-explorer
git add media/dashboard.js
git commit -m "feat: add scenario view, quick create, and top scenarios to dashboard"
```

---

## Task 8: 前端检查清单渲染

**Files:**
- Modify: `media/dashboard.js`

- [ ] **Step 1: 修改 renderSkillDetail 支持 checklist 类型**

```javascript
// media/dashboard.js
// 替换 renderSkillDetail 函数

  function renderSkillDetail() {
    const { skills } = state.data;
    const skill = skills.find(s => s.id === state.currentSkillId);
    if (!skill) return '<div class="error-page">技能未找到</div>';

    const isFav = state.favorites.includes(skill.id);
    const isChecklist = skill.type === 'checklist';

    return `
      <div class="skill-detail">
        <button class="back-btn" id="skill-back">← 返回</button>
        <div class="skill-header">
          <div class="skill-name">${escapeHtml(skill.name)}</div>
          <div class="skill-meta">
            <span>版本: ${skill.version}</span>
            <span>${skill.date}</span>
            ${isChecklist ? '<span class="skill-type-badge">📋 检查清单</span>' : ''}
          </div>
          <div class="skill-tags">
            ${skill.tags.map(t => `<span class="skill-tag">#${escapeHtml(t)}</span>`).join('')}
            ${skill.scenarioTags.map(t => `<span class="skill-tag scenario-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 11px; color: var(--fg-secondary);">
          ${skill.estimatedTime ? `<span>⏱ 预计: ${skill.estimatedTime}</span>` : ''}
          <span>${skill.standalone ? '🔗 可独立使用' : '🔗 需配合智能体'}</span>
        </div>
        <div class="skill-actions">
          <button class="btn" id="btn-copy">📋 复制 Prompt</button>
          <button class="btn" id="btn-install-claude">⬇️ 安装到 Claude</button>
          <button class="btn" id="btn-install-cursor">⬇️ 安装到 Cursor</button>
          <button class="btn ${isFav ? 'btn-primary' : ''}" id="btn-favorite">${isFav ? '⭐ 已收藏' : '☆ 收藏'}</button>
        </div>
        <div class="skill-content" id="skill-content">
          ${isChecklist ? renderChecklist(skill.content) : markdownToHtml(skill.content)}
        </div>
      </div>
    `;
  }
```

- [ ] **Step 2: 新增 renderChecklist 函数**

```javascript
// media/dashboard.js
// 在 renderSkillDetail 之后添加

  function renderChecklist(content) {
    if (!content) return '';

    // 解析 Markdown 内容，提取 ## 标题和 - [ ] / - [x] 检查项
    const lines = content.split('\n');
    const steps = [];
    let currentStep = null;

    for (const line of lines) {
      const stepMatch = line.match(/^##\s+(.+)$/);
      if (stepMatch) {
        if (currentStep) steps.push(currentStep);
        currentStep = { title: stepMatch[1].trim(), items: [] };
        continue;
      }

      const itemMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
      if (itemMatch && currentStep) {
        currentStep.items.push({
          checked: itemMatch[1] === 'x',
          text: itemMatch[2].trim()
        });
      }
    }
    if (currentStep) steps.push(currentStep);

    const totalItems = steps.reduce((sum, s) => sum + s.items.length, 0);
    const checkedItems = steps.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return `
      <div class="checklist-container">
        <div class="checklist-progress">
          <div class="checklist-progress-bar">
            <div class="checklist-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="checklist-progress-text">${progress}% (${checkedItems}/${totalItems})</div>
        </div>
        ${steps.map((step, stepIndex) => `
          <div class="checklist-step">
            <div class="checklist-step-header">
              <span class="checklist-step-toggle">▶</span>
              <span class="checklist-step-title">${escapeHtml(step.title)}</span>
              <span class="checklist-step-count">${step.items.filter(i => i.checked).length}/${step.items.length}</span>
            </div>
            <div class="checklist-step-content">
              ${step.items.map((item, itemIndex) => `
                <label class="checklist-item">
                  <input type="checkbox" class="checklist-checkbox"
                    data-step="${stepIndex}" data-item="${itemIndex}"
                    ${item.checked ? 'checked' : ''}>
                  <span class="checklist-item-text">${escapeHtml(item.text)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
        ${progress === 100 && totalItems > 0 ? '<div class="checklist-complete">✅ 全部完成</div>' : ''}
      </div>
    `;
  }
```

- [ ] **Step 3: 修改 attachSkillEvents 增加检查清单交互**

```javascript
// media/dashboard.js
// 替换 attachSkillEvents 函数

  function attachSkillEvents() {
    document.getElementById('skill-back')?.addEventListener('click', () => navigateTo('/dashboard'));
    document.getElementById('btn-copy')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'copy:prompt', skillId: state.currentSkillId });
    });
    document.getElementById('btn-install-claude')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'install:skill', skillId: state.currentSkillId, target: 'claude-code' });
    });
    document.getElementById('btn-install-cursor')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'install:skill', skillId: state.currentSkillId, target: 'cursor' });
    });
    document.getElementById('btn-favorite')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'toggle:favorite', skillId: state.currentSkillId });
    });

    // 检查清单交互
    document.querySelectorAll('.checklist-step-header').forEach(header => {
      header.addEventListener('click', () => {
        const step = header.closest('.checklist-step');
        const content = step.querySelector('.checklist-step-content');
        const toggle = header.querySelector('.checklist-step-toggle');
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.textContent = isExpanded ? '▶' : '▼';
      });
    });

    document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        // v0.2.0：仅更新 UI，不持久化
        updateChecklistProgress();
      });
    });

    // 默认展开第一个未完成的步骤
    document.querySelectorAll('.checklist-step').forEach((step, index) => {
      const content = step.querySelector('.checklist-step-content');
      const toggle = step.querySelector('.checklist-step-toggle');
      const hasUnchecked = step.querySelectorAll('.checklist-checkbox:not(:checked)').length > 0;
      if (index === 0 || hasUnchecked) {
        content.style.display = 'block';
        toggle.textContent = '▼';
      } else {
        content.style.display = 'none';
        toggle.textContent = '▶';
      }
    });
  }
```

- [ ] **Step 4: 新增 updateChecklistProgress 函数**

```javascript
// media/dashboard.js
// 在 attachSkillEvents 之后添加

  function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.checklist-checkbox');
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

    const fill = document.querySelector('.checklist-progress-fill');
    const text = document.querySelector('.checklist-progress-text');
    if (fill) fill.style.width = `${progress}%`;
    if (text) text.textContent = `${progress}% (${checked}/${total})`;

    // 更新每个步骤的计数
    document.querySelectorAll('.checklist-step').forEach(step => {
      const stepCheckboxes = step.querySelectorAll('.checklist-checkbox');
      const stepChecked = step.querySelectorAll('.checklist-checkbox:checked').length;
      const countEl = step.querySelector('.checklist-step-count');
      if (countEl) countEl.textContent = `${stepChecked}/${stepCheckboxes.length}`;
    });

    // 显示/隐藏完成提示
    const container = document.querySelector('.checklist-container');
    let completeEl = container?.querySelector('.checklist-complete');
    if (progress === 100 && total > 0) {
      if (!completeEl) {
        completeEl = document.createElement('div');
        completeEl.className = 'checklist-complete';
        completeEl.textContent = '✅ 全部完成';
        container?.appendChild(completeEl);
      }
    } else if (completeEl) {
      completeEl.remove();
    }
  }
```

- [ ] **Step 5: Commit**

```bash
cd vscode-file-explorer
git add media/dashboard.js
git commit -m "feat: render checklist-type skills with interactive checkboxes and progress"
```

---

## Task 9: 前端设置页扩展

**Files:**
- Modify: `media/dashboard.js`

- [ ] **Step 1: 修改 renderSettingsPage 增加行业包管理**

```javascript
// media/dashboard.js
// 替换 renderSettingsPage 函数

  function renderSettingsPage() {
    vscode.postMessage({ type: 'get:settings' });
    return `
      <div class="settings-page">
        <div class="section-header">
          <span class="section-title">⚙ 设置</span>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">基础设置</div>
          <div class="setting-item">
            <label class="setting-label">本地知识库路径</label>
            <div class="setting-desc">留空则使用内置模板</div>
            <input type="text" class="setting-input" id="setting-path" value="${escapeHtml(state.settings.localPath || '')}" placeholder="例如: C:\\Users\\name\\my-knowledge-base">
          </div>
          <div class="setting-item">
            <label class="setting-label">默认安装目标</label>
            <div class="setting-desc">技能安装的默认平台</div>
            <select class="setting-select" id="setting-target">
              <option value="claude-code" ${state.settings.defaultInstallTarget === 'claude-code' ? 'selected' : ''}>Claude Code</option>
              <option value="cursor" ${state.settings.defaultInstallTarget === 'cursor' ? 'selected' : ''}>Cursor</option>
              <option value="generic" ${state.settings.defaultInstallTarget === 'generic' ? 'selected' : ''}>通用</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">📦 行业知识包</div>
          <div class="setting-desc">加载行业专属的智能体和技能</div>
          <div id="industry-packages-list">
            <div class="industry-package-item">
              <div class="industry-package-info">
                <div class="industry-package-name">☑️ 电力行业 <span class="industry-package-version">v1.0.0</span></div>
                <div class="industry-package-meta">3 个集群 · 12 个技能</div>
              </div>
              <button class="btn industry-package-btn">禁用</button>
            </div>
          </div>
          <div style="margin-top: 8px;">
            <button class="btn" id="btn-add-industry">
              <span>+</span> 添加行业知识包
            </button>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-group-title">📥 批量导入</div>
          <div class="setting-desc">从目录或 JSON 导入扩展层 Skill</div>
          <div style="margin-top: 8px;">
            <button class="btn" id="btn-import-skills">
              <span>📂</span> 选择导入目录
            </button>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <button class="btn btn-primary" id="btn-save-settings">保存设置</button>
        </div>
      </div>
    `;
  }
```

- [ ] **Step 2: Commit**

```bash
cd vscode-file-explorer
git add media/dashboard.js
git commit -m "feat: extend settings page with industry package and import UI"
```

---

## Task 10: KnowledgeService 行业包加载

**Files:**
- Modify: `src/services/KnowledgeService.ts`

- [ ] **Step 1: 扩展 loadKnowledgeBase 支持行业包**

```typescript
// src/services/KnowledgeService.ts
// 在类中添加行业包相关属性

export class KnowledgeService {
  private knowledgeBase: KnowledgeBase = {
    clusters: [],
    agents: [],
    skills: [],
    scenes: [],
    roles: []
  };
  private industryPackages: IndustryPackage[] = [];

  // ... existing constructor

  public async loadKnowledgeBase(): Promise<KnowledgeBase> {
    // 加载核心模板
    const templatesPath = path.join(this.extensionPath, 'templates');
    const clustersPath = path.join(templatesPath, 'clusters');

    if (fs.existsSync(clustersPath)) {
      await this.scanClusters(clustersPath);
    }

    // 加载行业包（从配置读取路径）
    await this.loadIndustryPackages();

    return this.knowledgeBase;
  }
```

- [ ] **Step 2: 新增行业包加载方法**

```typescript
// src/services/KnowledgeService.ts
// 在类中添加新方法

  private async loadIndustryPackages(): Promise<void> {
    // 读取配置中的行业包路径列表
    const config = vscode.workspace.getConfiguration('aiKnowledgeBase');
    const packagePaths: string[] = config.get('industryPackages', []);

    for (const packagePath of packagePaths) {
      if (!fs.existsSync(packagePath)) continue;

      const packageJsonPath = path.join(packagePath, 'package.json');
      let packageMeta: Partial<IndustryPackage> = { name: path.basename(packagePath), version: '0.0.0' };

      if (fs.existsSync(packageJsonPath)) {
        try {
          const content = fs.readFileSync(packageJsonPath, 'utf-8');
          packageMeta = JSON.parse(content);
        } catch {
          // 忽略解析错误，使用默认名称
        }
      }

      const clustersPath = path.join(packagePath, 'clusters');
      if (!fs.existsSync(clustersPath)) continue;

      const beforeSkillCount = this.knowledgeBase.skills.length;
      await this.scanClusters(clustersPath, 'industry', packageMeta.name || 'unknown');
      const afterSkillCount = this.knowledgeBase.skills.length;

      this.industryPackages.push({
        id: packageMeta.name || path.basename(packagePath),
        name: packageMeta.name || path.basename(packagePath),
        version: packageMeta.version || '0.0.0',
        description: packageMeta.description || '',
        path: packagePath,
        clusterCount: 0, // 简化处理
        skillCount: afterSkillCount - beforeSkillCount,
        enabled: true
      });
    }
  }
```

- [ ] **Step 3: 修改 scanClusters 和 parseSkill 支持 source 参数**

```typescript
// src/services/KnowledgeService.ts
// 修改 scanClusters 签名和方法体

  private async scanClusters(
    clustersPath: string,
    source: 'core' | 'industry' = 'core',
    industryPackage?: string
  ): Promise<void> {
    const entries = fs.readdirSync(clustersPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
        await this.scanCluster(path.join(clustersPath, entry.name), entry.name, source, industryPackage);
      }
    }
  }
```

```typescript
// src/services/KnowledgeService.ts
// 修改 scanCluster 签名

  private async scanCluster(
    clusterPath: string,
    clusterId: string,
    source: 'core' | 'industry' = 'core',
    industryPackage?: string
  ): Promise<void> {
```

```typescript
// src/services/KnowledgeService.ts
// 修改 scanCluster 中的 skill 扫描调用

      } else if (entry.isDirectory() && entry.name === 'skills') {
        const skills = await this.scanSkills(
          path.join(clusterPath, entry.name),
          clusterId,
          source,
          industryPackage
        );
```

```typescript
// src/services/KnowledgeService.ts
// 修改 scanSkills 签名

  private async scanSkills(
    skillsPath: string,
    clusterId: string,
    source: 'core' | 'industry' = 'core',
    industryPackage?: string
  ): Promise<Skill[]> {
```

```typescript
// src/services/KnowledgeService.ts
// 修改 scanSkills 中的 parseSkill 调用

        const skill = await this.parseSkill(
          path.join(skillsPath, entry.name),
          clusterId,
          source,
          industryPackage
        );
```

```typescript
// src/services/KnowledgeService.ts
// 修改 parseSkill 签名和返回对象

  private async parseSkill(
    filePath: string,
    clusterId: string,
    source: 'core' | 'industry' = 'core',
    industryPackage?: string
  ): Promise<Skill | null> {
    // ... existing frontmatter parsing ...

    return {
      id: fileName,
      name: fm.name || fileName,
      description: fm.description || '',
      type: fm.type === 'checklist' ? 'checklist' : 'skill',
      version: fm.version || '1.0.0',
      date: fm.date || '',
      parentAgent: fm.parentAgent || '',
      cluster: clusterId,
      standalone: fm.standalone ?? true,
      tags: fm.tags || [],
      scenarioTags: fm.scenarioTags || [],
      source,
      industryPackage,
      input: fm.input,
      output: fm.output,
      estimatedTime: fm.estimatedTime,
      filePath,
      content: parsed.content
    };
  }
```

- [ ] **Step 4: 在 KnowledgeBase 中合并同名集群**

修改 `scanCluster` 方法，在 push 之前检查是否已存在同名集群：

```typescript
// src/services/KnowledgeService.ts
// 在 scanCluster 方法末尾，push 之前

    // 检查是否已存在同名集群，如果存在则合并
    const existingIndex = this.knowledgeBase.clusters.findIndex(c => c.id === clusterId);
    if (existingIndex >= 0) {
      this.knowledgeBase.clusters[existingIndex].agents.push(...cluster.agents);
      this.knowledgeBase.clusters[existingIndex].skills.push(...cluster.skills);
    } else {
      this.knowledgeBase.clusters.push(cluster);
    }
```

- [ ] **Step 5: 导入 vscode**

确保文件顶部导入了 vscode：

```typescript
// src/services/KnowledgeService.ts
// 文件顶部添加

import * as vscode from 'vscode';
import { IndustryPackage } from '../models/types';
```

- [ ] **Step 6: 编译验证**

Run: `cd vscode-file-explorer && npm run compile`
Expected: 无编译错误

- [ ] **Step 7: Commit**

```bash
cd vscode-file-explorer
git add src/services/KnowledgeService.ts
git commit -m "feat: load industry packages and merge with core knowledge base"
```

---

## Task 11: CSS 样式更新

**Files:**
- Modify: `media/dashboard.css`

- [ ] **Step 1: 添加双分类导航样式**

在 `media/dashboard.css` 末尾添加：

```css
/* 双分类导航 Tab */
.view-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: var(--gap);
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius);
}

.view-mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--fg-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-mode-btn:hover {
  background: var(--bg-hover);
  color: var(--fg-primary);
}

.view-mode-btn.active {
  background: var(--bg-active);
  color: var(--fg-primary);
  font-weight: 500;
}

/* 场景浏览网格 */
.scenarios-section {
  margin-bottom: var(--gap);
}

.scenarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.scenario-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: var(--card-bg);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  text-align: center;
}

.scenario-card:hover {
  background: var(--bg-hover);
  border-color: var(--border-color);
  transform: translateY(-2px);
}

.scenario-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.scenario-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.scenario-desc {
  font-size: 10px;
  color: var(--fg-secondary);
  line-height: 1.4;
}

.scenario-count {
  font-size: 10px;
  color: var(--fg-accent);
  margin-top: 6px;
}

/* 快速创建 */
.quick-create-section {
  margin-bottom: var(--gap);
}

.quick-create-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.quick-create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.quick-create-card:hover {
  background: var(--bg-hover);
  border-color: var(--fg-accent);
}

.quick-create-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.quick-create-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
}

.quick-create-desc {
  font-size: 10px;
  color: var(--fg-secondary);
}

/* 我的常用场景 */
.top-scenarios-section {
  margin-bottom: var(--gap);
}

.top-scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.top-scenario-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease;
}

.top-scenario-item:hover {
  background: var(--bg-hover);
}

.top-scenario-rank {
  width: 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--fg-accent);
}

.top-scenario-name {
  flex: 1;
  font-size: 13px;
}

.top-scenario-count {
  font-size: 11px;
  color: var(--fg-secondary);
}

/* 检查清单 */
.checklist-container {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 16px;
}

.checklist-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.checklist-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--card-bg);
  border-radius: 3px;
  overflow: hidden;
}

.checklist-progress-fill {
  height: 100%;
  background: var(--success);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.checklist-progress-text {
  font-size: 12px;
  color: var(--fg-secondary);
  white-space: nowrap;
}

.checklist-step {
  margin-bottom: 8px;
}

.checklist-step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--card-bg);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s ease;
}

.checklist-step-header:hover {
  background: var(--bg-hover);
}

.checklist-step-toggle {
  font-size: 10px;
  color: var(--fg-secondary);
  width: 14px;
  text-align: center;
}

.checklist-step-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
}

.checklist-step-count {
  font-size: 11px;
  color: var(--fg-secondary);
}

.checklist-step-content {
  padding: 8px 8px 8px 30px;
  display: none;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.checklist-checkbox {
  margin-top: 2px;
  width: 14px;
  height: 14px;
  accent-color: var(--fg-accent);
  cursor: pointer;
}

.checklist-item-text {
  font-size: 12px;
  line-height: 1.5;
  color: var(--fg-primary);
}

.checklist-complete {
  text-align: center;
  padding: 12px;
  background: var(--success);
  color: white;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
}

/* 技能类型标签 */
.skill-type-badge {
  padding: 2px 8px;
  background: var(--warning);
  color: #1e1e1e;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.scenario-tag {
  background: var(--bg-active);
}

/* 集群核心标签 */
.cluster-badge {
  padding: 1px 6px;
  background: var(--fg-accent);
  color: white;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
  margin-left: auto;
}

/* 设置页分组 */
.setting-group {
  margin-bottom: var(--gap);
  padding: var(--gap);
  background: var(--card-bg);
  border-radius: var(--radius);
}

.setting-group-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--fg-primary);
}

.industry-package-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  margin-bottom: 6px;
}

.industry-package-name {
  font-size: 13px;
  font-weight: 500;
}

.industry-package-version {
  font-size: 10px;
  color: var(--fg-secondary);
  font-weight: normal;
}

.industry-package-meta {
  font-size: 11px;
  color: var(--fg-secondary);
  margin-top: 2px;
}

.industry-package-btn {
  padding: 4px 10px;
  font-size: 11px;
}
```

- [ ] **Step 2: Commit**

```bash
cd vscode-file-explorer
git add media/dashboard.css
git commit -m "style: add CSS for dual-view navigation, scenarios, checklist, quick create"
```

---

## Task 12: 核心层内容重组

**Files:**
- Modify: `templates/clusters/` 下多个文件

- [ ] **Step 1: 为现有 Skill 补充 scenarioTags**

为每个现有 Skill 文件增加 `scenarioTags` frontmatter 字段：

`templates/clusters/01-需求工程/skills/会议纪要提取.md`:
```yaml
---
name: 会议纪要提取
description: 从会议录音或聊天记录中提取结构化会议纪要
type: skill
tags: [会议, 文档]
scenarioTags: [写文档, 管项目]
---
```

`templates/clusters/01-需求工程/skills/需求拆解.md`:
```yaml
---
name: 需求拆解
description: 将模糊需求拆解为可执行的用户故事和任务
type: skill
tags: [需求, 分析]
scenarioTags: [做设计, 管项目]
---
```

`templates/clusters/02-设计工程/skills/根据需求生成原型.md`:
```yaml
---
name: 根据需求生成原型
description: 基于需求文档生成产品原型设计
type: skill
tags: [设计, 原型]
scenarioTags: [做设计]
---
```

`templates/clusters/03-开发工程/skills/API设计.md`:
```yaml
---
name: API设计
description: 设计 RESTful API 接口规范
type: skill
tags: [开发, API]
scenarioTags: [写代码, 做设计]
---
```

`templates/clusters/04-测试工程/skills/测试用例生成.md`:
```yaml
---
name: 测试用例生成
description: 根据需求自动生成测试用例
type: skill
tags: [测试, 用例]
scenarioTags: [测试质量]
---
```

`templates/clusters/05-运维交付/skills/CI-CD配置.md`:
```yaml
---
name: CI-CD配置
description: 配置持续集成和持续部署流水线
type: skill
tags: [运维, CI/CD]
scenarioTags: [查故障, 写代码]
---
```

`templates/clusters/06-专项能力/skills/日志分析.md`:
```yaml
---
name: 日志分析
description: 分析系统日志定位问题根因
type: skill
tags: [运维, 日志]
scenarioTags: [查故障]
---
```

- [ ] **Step 2: 新增检查清单示例 Skill**

创建 `templates/clusters/05-运维交付/skills/采集故障排查.md`：

```markdown
---
name: 采集故障排查
description: 针对终端离线、召测失败等问题的标准化排查流程
type: checklist
tags: [运维, 采集, 故障排查]
scenarioTags: [查故障]
estimatedTime: 15分钟
---

## 步骤 1：确认故障现象
- [ ] 终端完全离线（ping 不通）
- [ ] 仅召测失败（ping 通但业务不通）
- [ ] 采集率下降而非完全中断

## 步骤 2：检查网络层
- [ ] Redis 集群连接状态正常
- [ ] 采集服务进程在运行
- [ ] 端口未被占用或防火墙拦截
- [ ] 网络连通性测试通过

## 步骤 3：检查业务层
- [ ] 采集任务配置正确且已下发
- [ ] 终端档案信息完整且有效
- [ ] 日志无异常报错或超时
- [ ] 数据库连接正常
```

- [ ] **Step 3: Commit**

```bash
cd vscode-file-explorer
git add templates/
git commit -m "content: add scenarioTags to all skills, add checklist example"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 需求 | 实现 Task |
|-----------|----------|
| 双分类导航（角色+场景） | Task 6, 7 |
| 开发工程集群排首位 | Task 6 (renderRoleView 中的 sort) |
| 统计卡片增加场景计数 | Task 3 (getStats), Task 6 (renderDashboard) |
| "我的常用场景"替代"热门技能" | Task 3 (getTopScenarios), Task 7 (renderMyTopScenarios) |
| 快速创建入口 | Task 7 (renderQuickCreate) |
| 行业知识包机制 | Task 10 (KnowledgeService), Task 9 (settings UI) |
| 检查清单式 Skill | Task 8 (renderChecklist) |
| 使用统计（本地个人） | Task 3 (RecentService) |
| 核心层/扩展层分层 | Task 12 (内容重组), Task 10 (source 标记) |
| 通信协议扩展 | Task 5 (DashboardWebviewViewProvider) |

**无遗漏。**

### 2. Placeholder Scan

- 无 TBD/TODO/"implement later"
- 所有代码步骤包含完整可执行代码
- 所有命令包含预期输出
- 类型名称前后一致（UsageStats, ViewMode, IndustryPackage, Scenario）

### 3. Type Consistency

- `Skill.type`: `'skill' | 'checklist'` — Task 1, 2, 10 一致
- `Skill.source`: `'core' | 'industry' | 'imported'` — Task 1, 2, 10 一致
- `scenarioTags: string[]` — Task 1, 2, 6, 7 一致
- `UsageStats` 结构 — Task 1, 3 一致

---

## 测试验证清单（手动）

完成所有 Task 后，按以下路径验证：

1. **编译通过**: `npm run compile` 无错误
2. **Dashboard 加载**: F5 启动，侧边栏正常显示 v0.2.0
3. **双分类切换**: 点击"按角色浏览"/"按场景浏览"Tab，内容正确切换
4. **开发工程首位**: 角色浏览模式下，开发工程集群排在第一位
5. **场景卡片**: 场景浏览模式下显示 8 个场景卡片，带技能计数
6. **检查清单**: 打开"采集故障排查"技能，显示交互式检查清单
7. **使用统计**: 点击几个技能后，"我的常用场景"区域更新
8. **搜索增强**: 搜索"写文档"，能匹配到带有该场景标签的技能
9. **设置页**: 设置页显示行业知识包和批量导入区域
