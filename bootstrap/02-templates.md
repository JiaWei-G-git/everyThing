## 第 2 步：写入模板文件

### 2.1 my-ai-vault/90-Templates/session_record.md

```markdown
---
project: "{{project}}"
date: "{{date}}"
topic: "{{topic}}"
source: "{{source}}"
tags: [{{tags}}]
status: active
# occurrence: 1                           # 可选：本月第几次遇到同类问题（AI 自动推断）
# related_sessions: []                    # 可选：关联的同类会话文件路径列表
---

# 会话记录 - {{topic}}

## 背景
{{background}}

## 用户提示词序列

按时间顺序列出本次会话中用户发出的所有实质性提示词/指令：

```
{{prompt}}
```

## 解决思路
{{solution}}

## 优化经验
{{optimization}}

## 本次可复用资产（可选）

> 如果本次会话中产生了可直接复用的 Prompt 或 Skill 片段，可在此记录。
> 注意：单次会话产出的内容通常不具备通用性，建议积累 3 次以上同类会话后，使用 `pattern-miner` 进行跨案例抽象。

### Prompt 片段
```
{{prompt_asset}}
```

### Skill 片段
- **触发条件**：{{skill_trigger}}
- **执行步骤**：{{skill_steps}}

## 关联笔记
- [[相关文档]]
```

---

### 2.2 my-ai-vault/90-Templates/prompt_asset.md

```markdown
---
title: "{{title}}"
category: "prompt"
source: "{{source}}"
extracted_date: "{{extracted_date}}"
applicable_scenario: "{{scenario}}"
maturity: "draft"
tags: [{{tags}}]
---

# {{title}}

## 场景
{{scenario}}

## 模板
```
{{template}}
```

## 变量说明
{{variables}}

## 效果记录
{{effect}}

## 关联笔记
- [[相关文档]]
```

---

### 2.3 my-ai-vault/90-Templates/weekly_report.md

```markdown
---
project: "{{project}}"
period: "{{period}}"
date: "{{date}}"
tags: [周报, {{project}}]
---

# {{project}} - 周报 {{period}}

## 本周进展
{{progress}}

## 关键成果
{{achievements}}

## 问题与解决方案
{{problems}}

## 资产沉淀
{{assets}}

## 下周计划
{{next_plan}}
```
