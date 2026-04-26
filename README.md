# AI 知识库智能体

> 基于 Markdown Vault 的个人 AI 知识库管理系统。
> 将 AI 协作过程中产生的高价值信息（Prompt、经验、工作流）沉淀为可复用资产。

核心闭环：

```
日常：使用 AI → 保存会话（纯日志）

周期：会话记录 → 盘点重复模式 → 跨案例抽象 → 人工确认 → 沉淀知识库

即兴：外部教程 / 灵感 → 资产提炼 → 人工确认 → 沉淀知识库
```

---

## 这是什么

在日常开发中，与 AI（Claude Code、Kimi Code、Cursor 等）的协作产生了大量高价值信息：Prompt、调试经验、角色定义、工作流等。这些信息散落在各 IDE 会话和聊天记录中，无法沉淀为可复用资产。

本项目通过 **AI 工具的 Skill 系统**，将协作过程自动归档到 Markdown Vault 中，形成个人/团队的知识库。

**所有功能通过自然语言触发，无需本地运行任何代码。**

---

## 如何创建项目

将整个 **`bootstrap/`** 文件夹提交给任意 AI 编码助手（Kimi Code / Claude Code / Cursor），AI 会按照文件夹内文档的规范完整生成整个项目。

生成内容包括：
- Vault 目录结构（18 个标准目录）
- 3 个 Markdown 模板（会话记录 / 周报 / Prompt 资产）
- 4 个 Skill 定义（会话记录 / 资产提炼 / 周报生成 / 模式挖掘）
- README.md 和 AGENTS.md

---

## 如何使用

### 第一步：安装 Skill

项目生成后，对 AI 说：

> **"请将当前项目 `my-ai-vault/30-Skills/` 下的四个 Skill 以符号链接（或等效方式）安装到你当前 AI 工具的 Skill 目录中，确保 `30-Skills/` 始终作为唯一来源。"**

AI 会根据所在工具自动处理：
- **Kimi Code**：`~/.kimi/skills/` ← Junction 到 `my-ai-vault/30-Skills/`
- **Claude Code**：`~/.claude/skills/` ← 等效机制

> 核心原则：`my-ai-vault/30-Skills/` 是**唯一来源**。符号链接的好处是——在 Vault 中修改 Skill，所有 AI 工具实时生效；版本一致性由 Git 管理。

**Windows 推荐方案：Junction（目录连接点）**

```powershell
$vaultSkills = "$PWD\my-ai-vault\30-Skills"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.kimi\skills\ai-vault" -Target $vaultSkills
```

> **注意**：不要使用 Windows 快捷方式（.lnk），AI 工具在扫描 Skill 目录时会跳过 `.lnk` 文件。

---

### 第二步：保存会话记录（纯日志，不做即时提炼）

在与 AI 完成一次有价值的协作后，说：

> **"保存本次会话"** 或 **"/save-session"**

AI 会：
1. 读取项目级 `AGENTS.md` / `CLAUDE.md` 中的归档路径配置
2. 首次使用会询问归档位置并记忆
3. 从会话上下文中自动采集主题、背景、有效提示词、解决思路、优化经验
4. 渲染标准模板并保存到 `01-Work-工作记录/<项目名>/会话记录/`
5. 通知你保存的完整路径

> **重要认知**：单次会话记录是**纯日志**，不是可直接提炼的原料。真正值得沉淀为 Skill 的，是跨会话的**重复模式**（同一类问题出现 ≥3 次）。保存会话后**不做即时提炼**，等待周期性盘点。

---

### 第三步：盘点重复模式（从工作记录中提炼）

每周或每月，对工作记录做一次模式盘点：

> **"盘点本周模式"** 或 **"/pattern"**

AI 会：
1. 扫描 `01-Work-工作记录/` 下最近 N 天的会话记录
2. 按 `topic` + `tags` 聚类统计频次
3. 输出「重复主题排行榜」（≥3 次的主题高亮建议提炼）
4. 你选择要提炼的主题
5. 读取该主题下的所有会话记录，进行**跨案例抽象**（归纳共性步骤、剔除特化操作）
6. 将通用 Skill / Prompt 草稿保存到 `00-Inbox-收件箱/待提炼/`

**与 `asset-extractor` 的区别**：`pattern-miner` 基于多条记录归纳共性，避免单次会话的伪通用问题。

---

### 第四步：提炼知识资产（从外部教程/即兴笔记中提炼）

对于外部文章、教程、即兴灵感等**单条原料**，说：

> **"提炼资产"** 或 **"/extract"**

AI 会：
1. 扫描 `00-Inbox` 和 `01-Work` 下的单条原料文件
2. 调用 LLM 分析并提取可复用的 Prompt / Skill
3. 将候选资产保存到 `00-Inbox-收件箱/待提炼/`
4. 汇报提炼结果

> **注意**：此方式适用于外部教程、即兴笔记。从**单次会话记录**中提炼存在伪通用风险，工作记录的通用 Skill 提炼应优先使用第三步的 `pattern-miner`。

---

### 第五步：生成周报

> **"生成本周周报"** 或 **"/weekly"**

AI 会：
1. 按项目聚合最近 7 天的会话记录
2. 选择模板（项目自定义 → 类型模板 → 默认模板）
3. 生成结构化周报并保存到 `01-Work-工作记录/<项目名>/文档/`

---

### 第六步：人工确认并归档

前往 `00-Inbox-收件箱/待提炼/` 审阅提取结果：

**审阅策略**：
- **高置信度资产**：AI 自动标注为 high confidence，可快速扫读后直接迁移
- **中低置信度资产**：AI 对话式逐条汇报（"这条 Skill 场景是 X，建议放 Y 目录，是否确认？"），你回复「确认/修改/跳过/删除」
- **30 秒规则**：每个草稿最多看 30 秒，不纠结，直觉判断

**迁移操作**：
- 质量达标的资产，手动移动到对应资产目录（`10-Prompts/` 或 `30-Skills/`）
- 修改 `maturity: draft` 为 `maturity: confirmed`
- 不达标的直接删除

---

## Vault 目录结构

Vault 采用**双轴分层**设计：原料层 → 资产层 → 产出/维护层。

```
my-ai-vault/
│
├── 00-Inbox-收件箱/              # 原料层 · 快速捕获
│   ├── 待提炼/                   #   提取的候选资产（人工确认前）
│   └── 未分类/                   #   临时存放，待整理
│
├── 01-Work-工作记录/              # 原料层 · 按项目聚合
│   └── <项目名>/
│       ├── 会话记录/              #   与 AI 的协作记录
│       ├── 日志/                  #   工作日志
│       └── 文档/                  #   周报、项目情况文档
│
├── 10-Prompts/                    # 资产层 · 优质 Prompt
├── 20-Agents/                     # 资产层 · 角色定义与交互流程
├── 30-Skills/                     # 资产层 · 原子 Skill（与 AI 工具共享）
│   ├── session-recorder/SKILL.md
│   ├── asset-extractor/SKILL.md
│   ├── weekly-generator/SKILL.md
│   └── pattern-miner/SKILL.md
├── 40-MCP/                        # 资产层 · MCP 服务定义
├── 50-Workflows-工作流/            # 资产层 · 多步骤工作流
├── 60-Tutorials-教程/              # 资产层 · 工具使用经验与教程
│
├── 70-Sharing-团队共享/            # 产出层 · 团队共享包
│
├── 90-Templates/                 # 维护层 · 模板
│   ├── session_record.md         #   会话记录标准模板
│   ├── prompt_asset.md           #   Prompt 资产模板
│   ├── weekly_report.md          #   周报模板
│   └── 周报/                     #   周报模板（可自定义）
│
└── 99-Archive/                     # 维护层 · 历史归档
    └── 资产版本历史/               #   资产的版本备份
```

### 目录流转规则

| 阶段 | 所在目录 | 说明 |
|------|---------|------|
| 原料捕获 | `00-Inbox` / `01-Work` | 会话记录、工作日志等原始材料 |
| 候选提取 | `00-Inbox-收件箱/待提炼` | LLM 提取的草稿，需人工确认 |
| 资产沉淀 | `10~60` | 确认后的可复用资产 |
| 团队共享 | `70-Sharing` | 打包分享给团队的资产集合 |
| 模板维护 | `90-Templates` | 周报模板等标准化文档 |
| 历史归档 | `99-Archive` | 过期或旧版本资产 |

---

## 配置说明

### 项目级配置（`AGENTS.md` / `CLAUDE.md`）

在每个代码项目的根目录创建，用于记忆 Vault 相关路径：

```markdown
<!-- AI-Vault-Config -->
- session_archive_path: "01-Work-工作记录/XX项目/会话记录/"
- weekly_template: "90-Templates/周报/敏捷开发-周报模板.md"
```

**作用**：
- `session_archive_path`：会话记录的自动归档位置，首次设置后自动复用
- `weekly_template`：该项目的专属周报模板（可选）

**Skill 如何读取**：AI 扫描当前工作目录下的 `AGENTS.md` 或 `CLAUDE.md`，按行匹配配置项。

---

## 关联文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **一键生成** | `bootstrap/` | **AI 一键重建整个项目** |
| 架构设计 | `docs/知识库架构与流转流程-2026-04-25.md` | Vault 设计权威参考 |
| PRD v2.0 | `docs/superpowers/specs/2026-04-25-ai-vault-prd-v2-design.md` | 完整需求文档 |

---

> **版本**: v1.0.0 (Hackathon MVP)
> **维护者**: 产品负责人

---

## 作品边界与限制

- 本版本为**个人使用**设计，暂不支持多人协作、并发编辑、权限管理
- 依赖 AI 工具的 **Skill 系统**，需在 Kimi Code / Claude Code / Cursor 等支持 Skill 的 AI 编码助手中运行
- 所有操作通过**自然语言触发**，无 GUI 界面，无传统 Web 服务
- **模式挖掘质量受 LLM 能力限制**：单次盘点建议 ≤30 条记录，超长上下文可能影响聚类精度
- **当前为 MVP 版本**：Vault 目录结构和 4 个核心 Skill 已完整，但部分资产内容为演示数据

---

## 运行依赖

- **AI 工具**：Kimi Code / Claude Code / Cursor 等支持 Skill 系统的 AI 编码助手（任一即可）
- **Git**：用于版本管理和 Skill 同步
- **无其他运行时依赖**：纯 Markdown 项目，无需 Node.js、Python、Docker、数据库等

---

## Vibe Coding 说明

本项目采用 **Vibe Coding** 方式开发：开发者通过自然语言描述需求，AI 生成完整的 Skill 定义、目录结构和项目文档。项目本身无传统代码，所有"逻辑"以 Markdown 形式的 Skill 定义存在，由 AI 工具在运行时解析执行。

**开发过程**：
1. 开发者提出"想要一个管理 AI 协作知识的系统"
2. AI 建议"纯 Markdown + Skill 系统"方案，替代了最初的 Python 脚本方案
3. AI 编写 4 个核心 Skill（session-recorder / asset-extractor / pattern-miner / weekly-generator）
4. AI 生成 bootstrap 模板，支持一键重建整个项目
5. 开发者通过自然语言测试、调优，AI 协助修复边界问题

---

## 引用与致谢

- 项目灵感来源于 **Obsidian + Zettelkasten** 知识管理方法论
- Skill 系统设计参考 **Kimi Code CLI** 和 **Claude Code** 的 Skill 规范
- Vault 目录流转规则借鉴 **PARA 方法**（Projects / Areas / Resources / Archives）
