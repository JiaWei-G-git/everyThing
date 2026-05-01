# VS Code 插件 Dashboard 改造设计文档

## 项目信息

- **日期**: 2026-05-01
- **主题**: 将 ai-knowledge-base VS Code 插件从 TreeView 改造为 Dashboard 风格 WebviewView
- **状态**: 待实现

---

## 背景与目标

### 当前状态

现有插件使用标准的 VS Code TreeView 展示知识库层级结构（集群 → 智能体 → 技能），点击技能后在编辑器区域打开 WebviewPanel 显示详情。

### 目标状态

将插件改造为网页原型（https://t7rukpsxrg362.ok.kimi.link/）展示的 Dashboard 风格：

- **所有内容集中在左侧 sidebar**，不再需要右侧主面板
- **抛弃 TreeView 导航树**，改用完整的 WebviewView Dashboard
- **保留原型所有模块**：统计卡片、集群入口、最近使用、热门技能、新手上路
- **新增视图**：搜索、收藏、设置、集群详情、技能详情
- **自适应宽度**，默认推荐 550px sidebar 宽度

---

## 整体架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    VS Code Extension                      │
├─────────────────────────────────────────────────────────┤
│  Sidebar (Activity Bar)                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  DashboardWebviewViewProvider                   │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │  WebviewView (dashboard.html)          │   │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ │   │   │
│  │  │  │ Dashboard│ │ Cluster │ │  Skill   │ │   │   │
│  │  │  │  首页    │ │ 详情页  │ │ 详情页   │ │   │   │
│  │  │  │ Search   │ │ Favorites│ │ Settings │ │   │   │
│  │  │  └─────────┘ └─────────┘ └──────────┘ │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
│                         ↑↓ postMessage                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Extension Backend                                │   │
│  │  • KnowledgeService (数据加载)                   │   │
│  │  • SearchService (搜索)                          │   │
│  │  • InstallService (安装到 Claude/Cursor)         │   │
│  │  • RecentService (最近使用管理)                  │   │
│  │  • globalState (最近使用、收藏持久化)            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 文件结构

```
vscode-file-explorer/
├── package.json                          # 修改 view 为 webviewView
├── src/
│   ├── extension.ts                      # 注册 DashboardWebviewViewProvider
│   ├── models/types.ts                   # 已有，无需大改
│   ├── services/
│   │   ├── KnowledgeService.ts           # 已有
│   │   ├── SearchService.ts              # 已有
│   │   ├── InstallService.ts             # 已有
│   │   └── RecentService.ts              # 新增：管理最近使用
│   ├── providers/
│   │   ├── DashboardWebviewViewProvider.ts  # 新增（核心）
│   │   └── KnowledgeTreeProvider.ts         # 删除
│   └── utils/
│       └── ...                           # 已有
└── media/
    ├── dashboard.html                    # 新增：Webview 入口
    ├── dashboard.css                     # 新增：样式
    └── dashboard.js                      # 新增：前端 SPA 逻辑
```

### package.json 关键修改

- `views` 中 `aiKnowledgeBase.sidebar` 改为由 `DashboardWebviewViewProvider` 提供（`type: webview`）
- 保留所有 commands，但命令处理改为与 Webview 交互
- 新增 `aiKnowledgeBase.refreshDashboard` 命令

---

## Webview 内部路由与视图

### 视图列表

| 路由 | 视图 | 说明 |
|------|------|------|
| `/dashboard` | **Dashboard 首页** | 默认视图，包含所有原型模块 |
| `/cluster/:id` | **集群详情页** | 显示该集群下的智能体列表，点击智能体展开技能 |
| `/skill/:id` | **技能详情页** | 显示技能元数据 + Markdown 内容 + 操作按钮 |
| `/search?q=...` | **搜索结果页** | 搜索技能/智能体/集群的列表结果 |
| `/favorites` | **收藏页** | 用户收藏的技能列表 |
| `/settings` | **设置页** | 配置本地知识库路径、默认安装目标等 |
| `/recent` | **最近使用页** | 完整的历史记录列表 |

### 顶部固定导航栏

在所有视图的顶部显示固定工具栏：

```
┌────────────────────────────┐
│ [🏠] [🔍] [⭐] [⚙]        │
│ 首页 搜索 收藏 设置         │
└────────────────────────────┘
```

点击后分别导航到 `/dashboard`、`/search`、`/favorites`、`/settings`。

### Dashboard 首页（`/dashboard`）布局

采用垂直流式布局，适配 sidebar 窄屏：

```
┌────────────────────────────┐
│  🤖 AI Knowledge Base      │
│     v1.0.0                 │
├────────────────────────────┤
│  欢迎来到 AI 技能知识库     │
│  沉淀团队 AI 协作最佳实践... │
├────────────────────────────┤
│  [🔍 快速搜索技能...    ]  │
│  [查看文档] [开始使用]      │
├────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 6  │ │ 17 │ │ 7  │     │
│  │集群│ │智能体│ │技能│     │
│  │+2  │ │+5  │ │+12 │     │
│  └────┘ └────┘ └────┘     │
├────────────────────────────┤
│  📋 选择你的角色，快速开始   │
│  ┌────────────────────┐   │
│  │ ⚡ 需求工程          │   │
│  │ 覆盖需求采集、分析... │   │
│  │ 3 个智能体  [进入>]  │   │
│  └────────────────────┘   │
│  (其余5个集群卡片...)      │
├────────────────────────────┤
│  🕐 最近使用      [全部]  │
│  • 需求拆解  2小时前      │
│  • React组件开发 昨天      │
│  • ...                   │
├────────────────────────────┤
│  🔥 热门技能        [全部] │
│  1. 需求拆解    1234次    │
│  2. React组件开发 986次   │
│  3. ...                  │
├────────────────────────────┤
│  🚀 新手上路              │
│  只需4步，开始使用...      │
│  01 了解智能体和集群  →    │
│  02 选择技能并安装    →    │
│  03 执行工作流        →    │
│  04 收藏常用技能      →    │
├────────────────────────────┤
│  [阅读完整指南] [视频教程]  │
└────────────────────────────┘
```

### 技能详情页（`/skill/:id`）布局

```
┌────────────────────────────┐
│ [← 返回]                  │
├────────────────────────────┤
│ 需求拆解                   │
│ 版本: v1.2.0  2026-04-15  │
│ #需求 #分析 #敏捷           │
├────────────────────────────┤
│ ⏱ 预计: 30分钟             │
│ 🔗 可独立使用              │
├────────────────────────────┤
│ [📋 复制Prompt]           │
│ [⬇️ 安装到Claude]         │
│ [⬇️ 安装到Cursor]         │
│ [⭐ 收藏]                 │
├────────────────────────────┤
│ Markdown 内容渲染区...     │
│ (折叠式/可滚动)            │
└────────────────────────────┘
```

---

## Extension ↔ Webview 通信协议

### Extension → Webview

| 消息类型 | 数据 | 触发时机 |
|---------|------|---------|
| `init:data` | 完整知识库（集群/智能体/技能列表） | Webview 首次加载完成 |
| `init:state` | 最近使用记录 + 收藏列表 + 统计数据 | Webview 首次加载完成 |
| `search:result` | 搜索结果数组 | 用户提交搜索后 |
| `install:result` | `{ success, message, path }` | 安装操作完成后 |
| `copy:result` | `{ success, message }` | 复制操作完成后 |
| `error` | `{ message, code }` | 任何操作出错时 |

### Webview → Extension

| 消息类型 | 数据 | 说明 |
|---------|------|------|
| `ready` | `{}` | Webview DOM 加载完成，请求初始数据 |
| `navigate` | `{ path }` | 内部路由切换（用于记录状态） |
| `search:query` | `{ query }` | 用户提交搜索 |
| `open:skill` | `{ skillId }` | 用户点击技能，Extension 记录到最近使用 |
| `install:skill` | `{ skillId, target }` | target: 'claude-code' \| 'cursor' |
| `copy:prompt` | `{ skillId }` | 复制技能 Prompt 到剪贴板 |
| `toggle:favorite` | `{ skillId }` | 切换收藏状态 |
| `get:settings` | `{}` | 请求当前设置 |

### 通信时序

```
Webview                     Extension
  │                            │
  │  ───── ready ───────────>  │
  │                            │  加载知识库
  │  <──── init:data ────────  │
  │  <──── init:state ───────  │
  │                            │
  │  [用户点击技能]              │
  │  ───── open:skill ──────>  │
  │                            │  记录到最近使用
  │  <──── init:state ───────  │  更新统计数据
  │                            │
  │  [用户点击安装到Claude]      │
  │  ─── install:skill ─────>  │
  │                            │  执行安装
  │  <── install:result ─────  │
```

---

## 数据持久化

使用 VS Code Extension `globalState`（Memento API）存储用户数据：

```typescript
interface UserState {
  recent: RecentItem[];      // 最近使用记录，最多 20 条
  favorites: string[];       // 收藏的技能 ID 列表
}

interface RecentItem {
  skillId: string;
  skillName: string;
  agentName: string;
  clusterName: string;
  timestamp: number;
}
```

**持久化时机：**
- 最近使用：用户点击技能时立即写入 globalState
- 收藏：用户点击收藏按钮时立即写入 globalState
- 统计数据（使用次数）：从最近使用记录实时计算，不单独存储

---

## 响应式布局

CSS 使用 CSS Grid + Flexbox，按宽度断点自适应：

| 宽度范围 | 布局 |
|---------|------|
| `< 400px` | 单列，所有模块垂直堆叠 |
| `400-600px` | 统计卡片 2 列，集群卡片单列 |
| `> 600px`（推荐 550px+） | 统计卡片 3 列，集群卡片 2 列网格 |

核心 CSS：

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
```

**关于 550px 默认宽度：**
VS Code API 没有直接设置 sidebar 宽度的方法。采用以下引导策略：
1. 首次激活时显示提示信息，告诉用户可以拖拽 sidebar 边界调整宽度
2. CSS 中使用 `min-width: 550px` 让内容在较窄时显示横向滚动条，提示用户拉宽
3. 在 README 中说明推荐宽度为 550px

---

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| 知识库加载失败 | Webview 显示错误页 + 重试按钮 |
| 搜索无结果 | 显示"未找到匹配技能"提示 |
| 安装失败 | Webview 内显示错误消息 + "手动安装"选项 |
| 网络/文件操作失败 | 顶部 toast 通知 + 控制台日志 |

---

## 废弃与删除

| 文件/组件 | 处理方式 | 说明 |
|----------|---------|------|
| `KnowledgeTreeProvider.ts` | **删除** | 被 DashboardWebviewViewProvider 替代 |
| `SkillDetailProvider.ts` | **删除** | 技能详情整合到 Webview 内部路由 |
| `media/skill-detail.html` | **删除** | 被 dashboard.html 替代 |

---

## 实现优先级

1. **P0 - 核心框架**
   - `DashboardWebviewViewProvider` 基础实现
   - `dashboard.html` 骨架 + CSS 基础样式
   - Extension ↔ Webview 通信基础层

2. **P1 - Dashboard 首页**
   - Logo + 欢迎语
   - 搜索框
   - 统计卡片
   - 集群入口卡片
   - 最近使用列表
   - 热门技能 TOP5
   - 新手上路引导

3. **P2 - 详情与交互**
   - 集群详情页 (`/cluster/:id`)
   - 技能详情页 (`/skill/:id`)
   - Markdown 渲染
   - 复制 Prompt / 安装到 Claude/Cursor

4. **P3 - 附加功能**
   - 搜索页 (`/search`)
   - 收藏页 (`/favorites`)
   - 设置页 (`/settings`)
   - 最近使用完整页 (`/recent`)
   - 收藏功能
   - RecentService 数据持久化
