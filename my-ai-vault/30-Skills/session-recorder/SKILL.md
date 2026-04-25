# 会话记录保存技能 (Session Recorder)

**版本**: v1.0.0
**类型**: Skill · 工作记录归档器

当用户说 **"保存会话"**、**"记录本次会话"** 或 **"/save-session"** 时触发此技能。

---

## 功能说明

将当前 AI 协作会话按标准格式归档到 Vault 的原料层。Skill 会自动记忆归档路径，首次询问、后续复用。

---

## 执行步骤

### 1. 读取项目级配置

检查当前工作目录下是否存在 `AGENTS.md` 或 `CLAUDE.md`，查找其中的 `session_archive_path` 配置：

```markdown
<!-- AI-Vault-Config -->
- session_archive_path: "01-Work-工作记录/XX项目/会话记录/"
```

### 2. 首次记录：交互式选择路径

如配置不存在，扫描 Vault 原料层目录，提供选项：
- `00-Inbox-收件箱/未分类`（临时入口）
- `01-Work-工作记录/<现有项目>/会话记录`
- `01-Work-工作记录/<现有项目>/日志`
- 新建项目目录

用户选择后，将路径写入项目级说明文件（`AGENTS.md` 或 `CLAUDE.md`）。

### 3. 二次记录：直接复用路径

如配置存在，直接读取 `session_archive_path`，不再询问用户。若路径失效，退回步骤 2。

### 4. 采集会话信息

向用户收集以下信息（可自动从当前上下文中提取部分字段）：
- **会话主题**（一句话概括）
- **项目名**（留空则使用路径中的项目名）
- **来源**（如 Kimi-Code / Claude-Code / Cursor）
- **背景描述**
- **核心 Prompt**（多行输入）
- **解决思路**
- **优化经验**

### 5. 渲染并保存

使用 `templates/session_record.md` 模板渲染，保存到：

```
{session_archive_path}/会话记录-YYYY-MM-DD-{简短主题}.md
```

**YAML Frontmatter 要求**：
```yaml
---
project: "XX项目"
date: "2026-04-25 14:30"
topic: "接口性能优化"
source: "Kimi-Code-Session"
tags: [backend, optimization]
status: active
---
```

**正文模板**：
- 背景
- Prompt
- 解决思路
- 优化经验
- 关联笔记

### 6. 通知用户

告知用户文件已保存的完整路径。

---

## 核心规则（不可违反）

1. **必须包含完整 YAML Frontmatter** — project, date, topic, source, tags, status 缺一不可；
2. **文件名自动去重** — 如遇同名追加序号；
3. **路径记忆持久化** — 配置必须写入项目级 `AGENTS.md` / `CLAUDE.md`，而非临时变量；
4. **默认兜底** — 用户未选择路径且无配置时，默认写入 `00-Inbox-收件箱/未分类/`。

---

## 使用示例

**用户**: "保存本次会话"

**执行**:
1. 读取项目级配置，检测 `session_archive_path`；
2. 如不存在，列出 Vault 原料目录供用户选择；
3. 采集主题、背景、Prompt、解决思路、优化经验；
4. 渲染模板并保存；
5. 通知用户保存路径。

---

## 版本信息

- **当前版本**: v1.0.0
- **支持输入**: 交互式采集 / 命令行参数
- **输出格式**: 标准 Markdown + YAML Frontmatter
