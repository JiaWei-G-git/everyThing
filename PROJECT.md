# AI 知识库智能体 — 项目说明

> **版本**: v1.0.0 (Hackathon MVP)  
> **日期**: 2026-04-25  
> **定位**: 基于 Markdown Vault 的个人 AI 知识库管理系统

---

## 项目概述

在日常开发工作中，与 AI（Claude Code、Kimi Code、Cursor、Codex 等）的协作产生了大量高价值信息：Prompt、调试经验、角色定义、工作流等。这些信息目前散落在各 IDE 会话、聊天记录中，无法沉淀为可复用的个人/团队资产。

本项目构建一个**基于 Markdown Vault 的个人 AI 知识库智能体**，核心闭环：

```
使用 AI → 保存会话 → 提炼资产 → 人工确认 → 沉淀知识库
```

---

## 技术架构

```
┌─────────────────────────────────────────────┐
│            交互层 (Kimi Code / Claude Code)    │
│         Skill 触发 → Python CLI 执行           │
└─────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────┐
│            核心引擎 (Python 3.10+)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 会话记录  │  │ 资产提炼  │  │ 周报生成  │  │
│  │ Skill    │  │ Skill    │  │ Skill    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐                │
│  │ Jinja2   │  │ LLM API  │                │
│  │ 模板渲染  │  │ (OpenAI  │                │
│  │          │  │ 兼容)    │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────┐
│            存储层 (Markdown Vault)            │
│  原料层 (00-Inbox / 01-Work)                │
│  资产层 (10-Prompts / 20-Agents / 30-Skills) │
│  模板层 (90-Templates)                       │
│  归档层 (99-Archive)                         │
└─────────────────────────────────────────────┘
```

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 开发语言 | Python 3.10+ | 标准库为主,轻量依赖 |
| 模板引擎 | Jinja2 | Markdown 模板渲染 |
| LLM 调用 | Requests + OpenAI 兼容接口 | 支持 Kimi / OpenAI / 企业中转 |
| 配置管理 | python-dotenv + Pydantic | 环境变量 + YAML |
| 文件操作 | pathlib | 跨平台路径处理 |
| 版本控制 | Git | 代码与 Skill 资产管理 |

---

## 项目目录结构

```
aiKnowledgeBase/                          # 项目根目录
│
├── src/                                  # 核心代码
│   ├── __init__.py
│   ├── config.py                         # Vault 目录常量 + LLM 配置
│   ├── utils.py                          # 文件名清洗、唯一路径、时间工具
│   ├── vault_initializer.py              # Vault 目录初始化
│   ├── session_recorder.py               # F-001: 会话记录 Skill 实现
│   └── asset_extractor.py                # F-003: 资产提炼 Skill 实现
│
├── templates/                            # Markdown 模板
│   ├── session_record.md                 # 会话记录标准模板
│   ├── weekly_report.md                  # 周报模板
│   └── prompt_asset.md                   # Prompt 资产模板
│
├── my-ai-vault/                          # Vault 根目录 (Git 忽略用户数据)
│   └── 30-Skills/                        # ← 核心 Skill 资产 (Git 跟踪)
│       ├── session-recorder/
│       │   └── SKILL.md                  # 会话记录 Skill 定义
│       ├── asset-extractor/
│       │   └── SKILL.md                  # 资产提炼 Skill 定义
│       └── weekly-generator/
│           └── SKILL.md                  # 周报生成 Skill 定义
│
├── docs/                                 # 文档
│   ├── 知识库架构与流转流程-2026-04-25.md  # 架构权威参考
│   └── superpowers/
│       ├── specs/                        # PRD v2.0 设计文档
│       └── plans/                        # Hackathon MVP 实施计划
│
├── demo/                                 # 演示数据
│   └── demo_inputs/
│       ├── session_demo_1.md             # 后端/SQL 优化主题
│       ├── session_demo_2.md             # 前端/Vue 组件主题
│       └── session_demo_3.md             # DevOps/Docker 主题
│
├── requirements.txt                      # Python 依赖
├── .env.example                          # 环境变量模板
├── .gitignore                            # Git 忽略规则
├── README.md                             # 快速开始指南
└── PROJECT.md                            # 本文件
```

---

## 核心功能模块

### F-001 会话记录 Skill

**文件**: `src/session_recorder.py` + `my-ai-vault/30-Skills/session-recorder/SKILL.md`

- 交互式归档会话记录到 Vault 原料层
- 首次询问路径,二次自动复用(记忆到 `AGENTS.md` / `CLAUDE.md`)
- 输出标准格式 Markdown(YAML Frontmatter + 背景/Prompt/解决思路/优化经验)

**运行**:
```bash
python -m src.session_recorder
```

---

### F-003 资产提炼 Skill

**文件**: `src/asset_extractor.py` + `my-ai-vault/30-Skills/asset-extractor/SKILL.md`

- 从原料文件中调用 LLM 提取 6 类可复用资产
- 输出到 `00-Inbox-收件箱/待提炼/` 等待人工确认
- 支持 Mock 模式(LLM 不可用时基于关键词匹配)

**运行**:
```bash
python -m src.asset_extractor                    # 批量扫描
python -m src.asset_extractor <文件路径>          # 单文件
python -m src.asset_extractor --mock             # Mock 模式
```

---

### F-009 周报生成 Skill (规划中)

**文件**: `my-ai-vault/30-Skills/weekly-generator/SKILL.md` (实现中)

- 按项目聚合会话记录,调用 LLM 生成周报
- 支持自定义模板(存放于 `90-Templates/周报/`)
- 模板选择记忆在项目级配置中

---

## 配置说明

### 环境变量 (.env)

```bash
# LLM API 配置
LLM_PROVIDER=anthropic          # 或 kimi / openai
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://token.longshine.com/v1
LLM_MODEL=qwen3.6-plus

# Vault 根目录
VAULT_ROOT=./my-ai-vault
```

### 项目级配置 (AGENTS.md / CLAUDE.md)

在每个代码项目的根目录下创建,用于记忆 Vault 相关路径:

```markdown
<!-- AI-Vault-Config -->
- vault_root: "D:/我的知识库"
- session_archive_path: "01-Work-工作记录/XX项目/会话记录/"
- weekly_template: "90-Templates/周报/敏捷开发-周报模板.md"
```

---

## 如何运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 API Key

```bash
cp .env.example .env
# 编辑 .env,填入 LLM_API_KEY
```

### 3. 初始化 Vault

```bash
python -m src.vault_initializer
```

### 4. 运行核心闭环

```bash
# 保存会话
python -m src.session_recorder

# 提炼资产(真实 LLM)
python -m src.asset_extractor

# 提炼资产(Mock 模式,无网络)
python -m src.asset_extractor --mock
```

---

## 里程碑

| 阶段 | 时间 | 目标 |
|------|------|------|
| MVP | 1 天 | 会话记录 → 资产提炼 → 待提炼区闭环 |
| M2 | 1 周 | 多项目归档、人工确认工作流、MOC 维护 |
| M3 | 2 周 | 周期调度、向量去重、团队共享包 |
| M4 | 1 月 | VS Code 插件、多工具深度集成 |

---

## 关联文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构与流转流程 | `docs/知识库架构与流转流程-2026-04-25.md` | Vault 设计权威参考 |
| PRD v2.0 | `docs/superpowers/specs/...` | 完整需求文档 |
| 实施计划 | `docs/superpowers/plans/...` | Hackathon MVP 计划 |
| 快速开始 | `README.md` | 用户入门指南 |

---

> **维护者**: 产品负责人  
> **协议**: 内部项目
