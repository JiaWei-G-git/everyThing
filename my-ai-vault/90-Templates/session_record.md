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
