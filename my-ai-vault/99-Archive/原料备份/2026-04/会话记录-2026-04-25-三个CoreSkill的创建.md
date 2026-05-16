---
project: "aiKnowledgeBase"
date: "2026-04-25 10:00"
topic: "三个 Core Skill 的创建"
source: "Kimi-Code"
tags: [skill, session-recorder, asset-extractor, weekly-generator]
status: active
pattern_extracted: true
pattern_id: "Skill文档开发与迭代-2026-04-26"
pattern_sessions: 5
archived: true
archive_date: "2026-04-26"
original_path: "my-ai-vault\01-Work-工作记录\aiKnowledgeBase\会话记录\会话记录-2026-04-25-三个CoreSkill的创建.md"
---

# 会话记录 - 三个 Core Skill 的创建

## 背景

MVP 的核心是三个 Skill：会话记录保存、资产提炼、周报生成。每个 Skill 需要定义触发条件、执行步骤、输出格式和质量规则。

## 用户提示词序列

```
[1] 帮我写 session-recorder 的 SKILL.md，要求：首次询问路径后续复用、标准 Markdown 格式、YAML Frontmatter

[2] 帮我写 asset-extractor 的 SKILL.md，要求：扫描原料文件、LLM 提取 6 类资产、输出到待提炼区

[3] 帮我写 weekly-generator 的 SKILL.md，要求：按项目聚合会话记录、支持自定义模板、生成周报

[4] 三个 Skill 的执行步骤要足够详细，AI 执行时不会脑补
```

## 解决思路

**Skill 文档结构标准化**：

每个 SKILL.md 统一包含：
```
# Skill名称
版本 + 类型
触发条件
---
功能说明
---
执行步骤（1. 2. 3. ...）
---
核心规则（不可违反）
---
使用示例
---
版本信息
```

**F-001 会话记录 Skill**：
- 触发：`保存会话` / `/save-session`
- 核心：读取 AGENTS.md -> 选择路径 -> 采集信息 -> 渲染模板 -> 保存
- 记忆机制：session_archive_path 写入 AGENTS.md/CLAUDE.md

**F-003 资产提炼 Skill**：
- 触发：`提炼资产` / `/extract`
- 核心：扫描原料 -> LLM 分析 -> 提取 6 类资产 -> 保存草稿
- Mock 回退：API 额度不足时用关键词匹配模拟

**F-009 周报生成 Skill**（规划中）：
- 触发：`生成本周周报` / `/weekly`
- 核心：读取配置 -> 聚合原料 -> 选择模板 -> LLM 生成 -> 质量检查

## 优化经验

1. Skill 中的"执行步骤"越具体越好。AI 执行时不会脑补，每一步都要明确告诉它做什么
2. "核心规则"章节很重要。用"不可违反"的措辞能显著提升 AI 的遵循率
3. 触发词要覆盖用户的自然表达，不能只依赖命令格式（如 `/save-session`）
4. 版本信息要包含支持资产类型和支持模式，便于后续迭代时判断兼容性

## 关联笔记
- [[项目脚手架搭建与 Vault 初始化]]
- [[项目从 Python 模式到纯 Skill 模式的转型]]
