<!-- AI-Vault-Config -->

- session_archive_path: "01-Work-工作记录/aiKnowledgeBase/会话记录"
- pattern_miner_last_scan: "2026-04-26T22:10:00"

---

# AGENTS.md — AI 知识库智能体项目指南

> **阅读对象**：AI 编码助手（Kimi Code / Claude Code / Cursor 等）
> **语言**：中文为主，代码注释和配置混合中英文
> **版本**：v1.0.0 (Hackathon MVP)

---

## 1. 项目概览

本项目是一个**双轨架构**的 AI 知识库管理系统，包含：

1. **Markdown Vault 知识库** (`my-ai-vault/`)：纯 Markdown 形式的 AI 协作资产管理系统，通过 Skill 机制在 AI 编码助手中运行，无传统运行时依赖。
2. **VS Code 扩展** (`vscode-file-explorer/`)：名为 `ai-knowledge-base` (v0.1.1) 的 TypeScript 扩展，在 VS Code 侧边栏提供可视化 Dashboard，用于浏览、搜索、安装 Skill。

核心闭环：

```
使用 AI → 保存会话 → 盘点重复模式 → 跨案例抽象 → 人工确认 → 沉淀知识库 → 更高效使用 AI
```

### 1.1 仓库结构

```
aiKnowledgeBase/
├── my-ai-vault/                    # Markdown Vault 知识库（核心资产）
│   ├── 00-Inbox-收件箱/             # 原料层 · 快速捕获
│   ├── 01-Work-工作记录/            # 原料层 · 按项目聚合
│   ├── 10-Prompts/                  # 资产层 · 优质 Prompt
│   ├── 20-Agents/                   # 资产层 · 角色定义
│   ├── 30-Skills/                   # 资产层 · 可执行 Skill（与 AI 工具共享）
│   ├── 40-MCP/                      # 资产层 · MCP 服务定义
│   ├── 50-Workflows-工作流/          # 资产层 · 多步骤工作流
│   ├── 60-Tutorials-教程/            # 资产层 · 教程与工具指南
│   ├── 70-Sharing-团队共享/          # 产出层 · 团队共享包
│   ├── 90-Templates/                # 维护层 · 模板
│   ├── 99-Archive/                  # 维护层 · 历史归档
│   ├── bootstrap/                   # 零到一搭建包（AI 可据此重建整个 Vault）
│   └── 资产总览.md                   # Vault 总目录
│
├── vscode-file-explorer/           # VS Code 扩展（可视化入口）
│   ├── src/                         # TypeScript 源码
│   ├── media/                       # Webview 前端（HTML/CSS/JS）
│   ├── templates/                   # 扩展内置知识库模板
│   ├── out/                         # tsc 编译输出
│   ├── package.json                 # 扩展清单
│   └── tsconfig.json                # TypeScript 配置
│
├── docs/                            # 项目文档
│   ├── 知识库架构与流转流程-2026-04-25.md
│   └── superpowers/
│       ├── specs/2026-04-25-ai-vault-prd-v2-design.md
│       └── plans/
│
├── README.md                        # 项目总览（面向人类用户）
├── AGENTS.md                        # 本文件（面向 AI 编码助手）
├── doc_content.json                 # Web 应用全生命周期智能体体系规划（独立大文档）
└── .mcp.json                        # MCP 服务器配置（Playwright）
```

### 1.2 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| Vault 知识库 | 纯 Markdown + YAML Frontmatter | 无运行时，依赖 AI 工具 Skill 系统解析执行 |
| VS Code 扩展 | TypeScript / Node.js | 目标 ES2020，CommonJS 模块 |
| 扩展前端 | Vanilla JS (IIFE) + 纯 CSS | Webview 内单页应用，无 React/Vue 等框架 |
| 数据解析 | 自定义 YAML-like 解析器 | `src/utils/markdownParser.ts`，不依赖 js-yaml |
| 包管理 | npm | 扩展目录下独立运行 `npm install` |

---

## 2. VS Code 扩展构建与运行

### 2.1 进入扩展目录

```bash
cd vscode-file-explorer
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 编译

```bash
# 一次性编译
npm run compile

# 监视模式
npm run watch
```

### 2.4 调试运行

1. 在 VS Code 中打开 `vscode-file-explorer/` 文件夹
2. 按 `F5` 启动 Extension Host
3. 左侧活动栏会出现 `$(book)` 图标（AI 技能知识库）

### 2.5 打包发布

```bash
npm run vscode:prepublish   # 等价于 npm run compile
# 然后使用 vsce package 生成 .vsix
```

---

## 3. 代码组织与模块划分（VS Code 扩展）

```
src/
├── extension.ts                        # 入口：激活/注销，组装服务与 Provider
├── models/
│   └── types.ts                        # 全项目类型定义（Skill, Agent, Cluster 等）
├── utils/
│   └── markdownParser.ts               # 自定义 YAML-like Frontmatter 解析器 + 标题提取
├── services/
│   ├── KnowledgeService.ts             # 扫描 templates/clusters/，解析 .md，构建内存索引
│   ├── SearchService.ts                # 加权全文搜索（名称/描述/标签/内容/集群名）
│   ├── InstallService.ts               # 向 Claude Code / Cursor / 剪贴板 安装 Skill
│   └── RecentService.ts                # 最近浏览、收藏夹、Dashboard 统计，持久化到 globalState
└── providers/
    └── DashboardWebviewViewProvider.ts # WebviewViewProvider：加载 media/dashboard.html，管理双向消息
```

### 3.1 架构模式

- **Markdown-as-Data**：整个知识库由带 YAML Frontmatter 的 Markdown 文件驱动，无数据库或 API。
- **SPA-in-a-Webview**：单个 `WebviewView` 内实现客户端路由（`/dashboard`, `/cluster`, `/skill`, `/search`, `/favorites`, `/settings`），通过 DOM 操作渲染。
- **消息驱动通信**：前后端通过 VS Code `postMessage` 严格通信，协议类型包括 `ready`, `init:data`, `open:skill`, `search:query`, `install:skill`, `toggle:favorite` 等。
- **模板目录约定**：`templates/clusters/` 下集群目录名必须匹配 `/^\d{2}-/`（如 `01-需求工程`），数字前缀剥离后作为集群名。Agent 文件放在集群根目录（排除 `INDEX.md`），Skill 放在 `skills/` 子目录。

---

## 4. 代码风格指南

### 4.1 TypeScript（扩展端）

- 严格模式已开启（`tsconfig.json` 中 `"strict": true`）
- 使用 `commonjs` 模块和 `ES2020` 目标
- 优先使用 `const`/`let`，避免 `var`
- 类型定义集中放在 `src/models/types.ts`
- Service 层保持无状态或仅依赖 VS Code API（`ExtensionContext`、`globalState`）
- 错误处理：使用 `try/catch`，错误消息通过 `vscode.window.showErrorMessage` 暴露给用户

### 4.2 Markdown（Vault 端）

- **文件编码**：UTF-8，无 BOM
- **YAML Frontmatter 标准**：所有结构化文件顶部必须包含 `---` 包围的 Frontmatter
- **Skill 文件**：每个 Skill 独立目录，目录内固定名为 `SKILL.md`
- **目录命名**：保留原始中文，禁止转译为拼音或英文
- **文件名前缀规范**：
  - `Prompt-*.md`：Prompt 模板
  - `Skill-*.md`：Skill 草稿（在 Inbox 中）
  - `会话记录-YYYY-MM-DD-*.md`：会话记录

### 4.3 前端（Webview 端）

- Vanilla JS，IIFE 模式，不使用模块化打包工具
- `media/dashboard.html` 中使用 `{{CSS_URI}}` 和 `{{JS_URI}}` 占位符，由 Provider 在运行时替换为 `webview.asWebviewUri()` 结果
- CSS 类名使用 kebab-case

---

## 5. 测试说明

**当前无正式测试框架。**

- `package.json` 中无测试脚本
- 无 Jest / Mocha / Vitest 等测试依赖
- 无测试文件
- `docs/plan.md` 中曾提及 `markdownParser.test.ts`，但未实际创建

**测试策略（当前以手动为主）**：

1. 编译通过：`npm run compile` 无 TypeScript 错误
2. 扩展宿主调试：按 `F5` 启动，验证侧边栏 Dashboard 正常加载
3. 功能路径验证：
   - Dashboard 导航（首页 → 集群 → Agent → Skill）
   - 全文搜索
   - 收藏/最近记录持久化
   - 安装到 Claude Code / Cursor / 剪贴板
4. Markdown 解析验证：在 `templates/clusters/` 下新增/修改文件，观察扩展是否正确解析 Frontmatter 和标题

---

## 6. 配置约定

### 6.1 项目级配置（`AGENTS.md` / `CLAUDE.md`）

在任意代码项目的根目录创建，用于记忆 Vault 相关路径。Skill 会扫描当前工作目录下的这两个文件并解析配置。

**精确格式**：

```markdown
<!-- AI-Vault-Config -->

- session_archive_path: "01-Work-工作记录/XX项目/会话记录"
- weekly_template: "90-Templates/周报/敏捷开发-周报模板.md"
- pattern_miner_last_scan: "2026-04-26T22:10:00"
```

**解析规则**：按行匹配 `- key: "value"`，取冒号后的值（去除首尾引号和空格）。

**写入规则**：
- 若文件已存在且无 `<!-- AI-Vault-Config -->` 标记，在文件末尾追加
- 若标记已存在，替换已有行
- 若两文件均不存在，新建 `AGENTS.md`

### 6.2 VS Code 扩展设置

在 `settings.json` 中配置：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `aiKnowledgeBase.localPath` | `string` | `""` | 用户本地知识库路径（留空使用内置模板） |
| `aiKnowledgeBase.defaultInstallTarget` | `string` | `"claude-code"` | 默认安装目标：`claude-code` / `cursor` / `generic` |

---

## 7. 安全与隐私注意事项

- **无网络请求**：扩展不连接任何外部服务器，所有数据为本地文件系统读取
- **安装操作写文件**：`InstallService` 会写入用户主目录（`~/.claude/skills/` 或项目下的 `.cursor/rules/`），操作前未做备份，建议谨慎使用
- **Webview 资源限制**：Dashboard 使用 `webview.asWebviewUri()` 限制本地资源访问，遵循 VS Code Webview 安全模型
- **Windows 路径处理**：使用 PowerShell Junction（目录连接点）进行 Skill 目录链接，不使用 `.lnk` 快捷方式（AI 工具会跳过 `.lnk`）
- **敏感文件排除**：`.gitignore` 已排除 `.env`、`.claude/`、`.vscode/` 等；`.vscodeignore` 排除了源码和开发文档

---

## 8. 关键设计原则（源自原始需求）

以下四点为项目创始需求，任何涉及目录结构、Skill 粒度或发现机制的重构都应以此为基准：

1. **Markdown 为核心**：以 Markdown 文档为 Skill 安装载体，内容多时可拆分为多文档，由目录文件统一索引。
2. **目录即发现机制**：提供按角色（如需求分析、设计）组织的目录，用户可在目录中找到智能体集群 → 智能体 → 具体 Skill，按需安装到个人 AI 工具。
3. **Skill 非单一职责**：Skill 可以不是原子化的，但需支持按需调用。例如一个包含「需求采集/去重/冲突」的 Skill，用户只想做「去重」时，只执行去重部分即可。
4. **可发现性优先**：目录结构必须让特定角色（如需求分析师）快速定位到相关智能体和 Skill。

---

## 9. 核心 Skill 清单

| Skill | 触发语 | 说明 |
|-------|--------|------|
| `session-recorder` | "保存会话" / "记录本次会话" | 归档当前会话到 Vault 原料层 |
| `asset-extractor` | "提炼资产" | 从单条原料提取 Prompt/Skill 候选 |
| `pattern-miner` | "盘点本周模式" | 扫描多条会话，聚类发现重复模式 |
| `weekly-generator` | "生成本周周报" | 按项目聚合生成结构化周报 |

---

## 10. 常用参考路径

| 文档 | 相对路径 | 用途 |
|------|----------|------|
| 项目总览 | `README.md` | 面向人类用户的完整使用指南 |
| 架构权威参考 | `docs/知识库架构与流转流程-2026-04-25.md` | Vault 双轴模型、三条流转路径、五条核心规则 |
| PRD v2.0 | `docs/superpowers/specs/2026-04-25-ai-vault-prd-v2-design.md` | 完整需求文档（F-001 ~ F-018） |
| 扩展设计 | `vscode-file-explorer/docs/design.md` | 扩展端架构与演化记录 |
| 扩展计划 | `vscode-file-explorer/docs/plan.md` | 开发计划与待办 |
| Vault 总目录 | `my-ai-vault/资产总览.md` | 资产分布与快速决策表 |
| 一键重建规范 | `my-ai-vault/bootstrap/` | AI 读取后可完整重建 Vault |
| 会话记录模板 | `my-ai-vault/90-Templates/session_record.md` | 会话记录标准模板 |
| 周报模板 | `my-ai-vault/90-Templates/weekly_report.md` | 默认周报模板 |
