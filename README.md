# AI 知识库智能体

基于 Markdown Vault 的个人 AI 知识库管理系统。将 AI 协作过程中产生的高价值信息（Prompt、经验、工作流）沉淀为可复用资产。

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 LLM API

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
# 编辑 .env，填入 LLM_API_KEY
```

### 3. 初始化 Vault

```bash
python -m src.vault_initializer
```

### 4. 保存会话记录

```bash
python -m src.session_recorder
```

首次使用会询问归档路径，后续自动复用。

### 5. 提炼资产

```bash
python -m src.asset_extractor
```

或指定单个文件：

```bash
python -m src.asset_extractor my-ai-vault/01-Work-工作记录/项目A/会话记录/xxx.md
```

## 目录结构

```
my-ai-vault/
├── 00-Inbox-收件箱/         # 原料·快速捕获
│   └── 待提炼/              #   待确认资产
├── 01-Work-工作记录/         # 原料·按项目聚合
├── 10-Prompts/               # 资产
├── 20-Agents/
├── 30-Skills/                # 与 AI 工具共享
├── 40-MCP/
├── 50-Workflows-工作流/
├── 60-Tutorials-教程/
├── 70-Sharing-团队共享/
├── 90-Templates-模板/        # 周报模板等
└── 99-Archive-归档/
```

## 核心闭环

```
使用 AI → 保存会话 → 提炼资产 → 人工确认 → 沉淀知识库
```

## 技术栈

- Python 3.10+
- Jinja2（模板渲染）
- Requests（LLM API 调用）
