# AI 技能知识库 VSCode 插件 —— 设计方案

> 日期：2026-04-30
> 版本：v1.0

---

## 一、项目概述

基于 `agentDocs` 需求文档，开发一款 VSCode 插件，帮助团队集中管理、浏览和使用 AI 协作技能（Prompt 模板）。

### 核心目标
- 按角色/场景快速找到所需技能
- 一键安装技能到 Claude Code / Cursor / 通用工具
- 支持团队自定义扩展知识库

### MVP 范围（第一阶段）
- 知识库树形浏览（集群 → 智能体 → 技能）
- 技能详情展示（Markdown 渲染）
- 多平台安装（Claude Code / Cursor / 通用）
- 全文搜索
- 内置默认模板 + 用户自定义知识库

### 后续版本（非 MVP）
- 技能创建/编辑向导
- 版本管理
- 使用反馈收集
- 技能使用统计

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode 插件架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │  侧边栏      │    │  命令面板    │    │   Webview 详情   │ │
│  │ TreeView    │◄──►│ QuickPick   │◄──►│    Panel        │ │
│  │             │    │  搜索/筛选   │    │  技能详情展示    │ │
│  └──────┬──────┘    └─────────────┘    └─────────────────┘ │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              核心控制器 (Extension Core)              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │   │
│  │  │Knowledge │ │  Search  │ │ Install  │ │ Template│ │   │
│  │  │  Service │ │  Service │ │  Service │ │ Service │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  数据层 (Data Layer)                   │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │   │
│  │  │ 内置模板     │    │ 本地知识库   │    │ 配置存储   │ │   │
│  │  │(插件打包)    │    │(用户workspace)│   │(Extension │ │   │
│  │  └─────────────┘    └─────────────┘    │  State)   │ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据流
1. **Knowledge Service** 同时读取内置模板目录和用户配置的本地知识库路径
2. 解析所有 Markdown 文件的 frontmatter，构建内存索引
3. **Search Service** 基于索引提供全文搜索、角色过滤、场景过滤
4. 用户点击技能 → **Webview Panel** 渲染技能详情
5. 用户点击安装 → **Install Service** 检测目标平台路径并执行安装

---

## 三、侧边栏结构（TreeView）

### 视图布局

```
┌──────────────────────────────┐
│ 📚 AI 技能知识库               │
├──────────────────────────────┤
│ [🔍 搜索技能...]              │
├──────────────────────────────┤
│ ▼ 📁 01-需求工程               │
│   ├─ 🤖 需求采集智能体         │
│   │   ├─ ⚡ 会议纪要提取       │
│   │   ├─ ⚡ 干系人访谈         │
│   │   └─ ⚡ 需求去重           │
│   ├─ 🤖 需求分析智能体         │
│   │   ├─ ⚡ 需求拆解           │
│   │   ├─ ⚡ 边界划分           │
│   │   └─ ⚡ SRS文档生成        │
│   └─ 🤖 数模生成智能体         │
│ ▶ 📁 02-设计工程               │
│ ...                           │
├──────────────────────────────┤
│ 最近查看                       │
│ ├─ SRS文档生成                │
│ └─ API设计                    │
└──────────────────────────────┘
```

### 节点类型

| 节点类型 | 图标 | 可展开 | 点击行为 |
|---------|------|--------|---------|
| 集群 | 📁 | ✅ | 展开/折叠 |
| 智能体 | 🤖 | ✅ | 展开/折叠，或打开详情 |
| 技能 | ⚡ | ❌ | 打开技能详情 Webview |

### 右键菜单
- 技能节点：安装到 Claude Code / 安装到 Cursor / 复制 Prompt / 复制文件路径
- 智能体节点：安装整个智能体 / 查看详情

---

## 四、数据模型

### 文件结构

```
插件内部：
templates/
├── clusters/
│   ├── 01-需求工程/
│   │   ├── INDEX.md
│   │   ├── 需求采集智能体.md
│   │   ├── 需求分析智能体.md
│   │   └── skills/
│   │       ├── 会议纪要提取.md
│   │       └── ...
│   └── ...
└── INDEX.md

用户工作区（可选）：
.ai-knowledge-base/
├── clusters/
└── INDEX.md
```

### TypeScript 接口

```typescript
interface KnowledgeBase {
  clusters: Cluster[];
  agents: Agent[];
  skills: Skill[];
  scenes: Scene[];
  roles: Role[];
}

interface Skill {
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

interface Agent {
  id: string;
  name: string;
  cluster: string;
  roles: string[];
  skills: string[];
  filePath: string;
}

interface Cluster {
  id: string;
  name: string;
  description: string;
  agents: string[];
}
```

---

## 五、技能详情 Webview 页面

### 页面布局

- **顶部工具栏**：技能名称 + 元数据（版本、日期、标签）+ 安装下拉菜单
- **内容区**：Markdown 渲染
  - 适用场景
  - 输入/输出
  - 执行步骤
  - **Prompt 模板**（高亮显示，带复制按钮）
  - 独立安装说明
- **底部操作栏**：平台安装按钮组

### 主题适配
- 自动读取 VSCode 当前主题颜色（深色/浅色）
- 使用 CSS 变量 `var(--vscode-*)` 保持一致性

---

## 六、安装流程

### 自动安装（路径检测成功）

1. 检测目标平台安装路径
   - Claude Code：`~/.claude/skills/` 或项目级 `.claude/skills/`
   - Cursor：项目级 `.cursor/rules/` 或 `.cursorrules`
2. 执行格式转换
   - Claude Code：简化 frontmatter + 祈使句执行逻辑
   - Cursor：提取 Prompt 模板生成 rules 文件
   - 通用：原始 Markdown
3. 复制文件到目标目录
4. 显示成功通知

### 手动模式（路径检测失败）

1. 弹窗提示未检测到安装路径
2. 提供选项：
   - 复制文件路径到剪贴板
   - 复制文件内容到剪贴板
   - 手动选择安装目录

---

## 七、搜索功能

### 触发方式
- 侧边栏顶部的搜索按钮
- 命令面板：`AI 知识库: 搜索技能`

### 搜索范围
- 技能名称
- 技能描述
- 标签
- Prompt 模板内容

### 搜索结果展示
- 使用 QuickPick 下拉列表
- 每项显示：技能名 + 所属智能体/集群 + 匹配高亮
- 选中后直接打开技能详情

---

## 八、配置项

### 用户可配置项

```json
{
  "aiKnowledgeBase.localPath": "",
  "aiKnowledgeBase.defaultInstallTarget": "claude-code",
  "aiKnowledgeBase.showBuiltinTemplates": true
}
```

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `localPath` | string | "" | 用户本地知识库路径 |
| `defaultInstallTarget` | string | "claude-code" | 默认安装目标平台 |
| `showBuiltinTemplates` | boolean | true | 是否显示内置模板 |

---

## 九、非功能需求

### 性能
- 知识库初始化（解析 Markdown）< 500ms（50 个技能以内）
- 搜索响应 < 100ms
- Webview 渲染 < 200ms

### 可靠性
- 本地知识库文件不存在时优雅降级（只显示内置模板）
- Markdown 解析错误时跳过该文件，不影响其他文件
- 安装失败时提供明确错误信息和替代方案

### 可扩展性
- 新增集群/智能体/技能只需在文件系统中添加文件，无需修改代码
- 支持未来添加新的安装目标平台

---

## 十、开发计划

### 阶段一：MVP（核心功能）
1. 项目脚手架搭建 + 配置
2. Knowledge Service：读取并解析内置模板
3. TreeView：侧边栏知识库浏览
4. Webview：技能详情展示
5. Install Service：多平台安装
6. Search Service：全文搜索
7. 打包测试

### 阶段二：增强功能
1. 用户本地知识库支持
2. 技能创建向导
3. 最近查看历史
4. 配置面板

### 阶段三：高级功能
1. 版本对比
2. 使用统计
3. 团队协作（Git 同步）
