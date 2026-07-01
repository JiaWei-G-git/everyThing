---
name: dare-req
description: >
  D.A.R.E.框架需求阶段对抗审查（REQ-Challenger）。当需求文档待评审、用户故事需要验证、产品方案需要批判性审视时触发。
  通过 Devil-BA、Devil-UX、Devil-Tech 和 Judge-Req 挖掘隐性假设、检测需求矛盾、挑战ROI合理性、预警范围蔓延。
  默认强度 Lv.2。
---

# D.A.R.E. 需求阶段对抗审查 (REQ-Challenger)

## 概述

需求阶段是错误成本最低但影响最大的阶段。REQ-Challenger 通过对抗性审查，在需求冻结前发现隐性假设、需求矛盾、ROI 不合理和范围蔓延风险。

审查流程：三 Devil 独立审查 → Judge-Req 裁决 → 输出结构化报告。

## 触发条件

- 需求文档变更为"待评审"状态
- 用户明确请求"审查需求"、"看看需求有没有问题"
- PR/Issue 描述中包含需求变更且影响 > 5 个用户故事
- 每周批量审查新增/变更需求

## 角色定义

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| Devil-BA | 挑战业务价值假设，质疑 ROI 合理性 | "这个需求解决的是真问题还是伪需求？" |
| Devil-UX | 挑战用户体验假设，发现场景遗漏 | "如果用户在弱网环境下操作，流程会断裂吗？" |
| Devil-Tech | 挑战技术可行性假设，标记实现风险 | "需求要求 100 万并发，但架构只验证了 1 万" |
| Judge-Req | 评估争议，判定问题成立与否 | 基于证据权重进行判定 |

## 默认配置

```yaml
default_level: 2
mode: debate
roles: [Devil-BA, Devil-UX, Devil-Tech, Judge-Req]
gate_policy:
  critical_blocker: critical > 0 → BLOCKED
  high_threshold: high > 3 → BLOCKED
```

## 对抗维度

| 维度 | 目标问题 | 映射到统一 dimension |
|------|----------|---------------------|
| 隐性假设挖掘 | 未声明的前提假设 | `correctness` |
| 需求矛盾检测 | 需求条目之间的逻辑冲突 | `correctness` |
| ROI合理性挑战 | 需求价值与实现成本不匹配 | `maintainability` |
| 范围蔓延预警 | 需求边界模糊导致的隐性扩展 | `maintainability` |

## 使用模式

### 模式A：单角色独立审查
用户提需求文档 → 选择 Devil-BA/UX/Tech → 执行审查 → 输出报告

### 模式B：三 Devil 并行 + Judge 裁决（推荐）
用户提需求文档 → 三角色并行审查 → Judge-Req 合并裁决 → 输出统一报告

### 模式C：双 Agent 辩论
用户提需求文档 → Devil 提出质疑 → Advocate 辩护 → Judge 裁决

## 输入

### 最小输入检查清单

为获得有效审查结果，请确保提供以下信息：

- [ ] **需求文档全文**：用户故事、验收标准、业务背景（必需）
- [ ] **关联架构文档或技术约束**：技术限制、外部依赖（推荐）
- [ ] **强度级别和模式覆盖**：如需特定审查深度（可选）
- [ ] **历史需求变更记录**：当前需求与之前版本的差异（可选，有助于发现矛盾）

## 输出

输出必须遵循 `references/req_output_schema.json`，该 Schema 已与 `dare-report/references/unified_schema.json` 对齐。

核心字段：
- `record_id`, `stage`, `timestamp`, `intensity_level`
- `review_summary`（字符串，≤200字）
- `issues[]`：每个 issue 包含 `issue_id`, `dimension`, `severity`, `description`, `evidence`, `impact`, `recommendation`
- `scores`: `{ overall, security, maintainability, performance, reliability?, scalability? }`（可选维度无数据时省略）
- `gate_result`: `PASSED` / `CONDITIONAL` / `BLOCKED`
- `confidence_score`: 0.0-1.0
- `assumptions_catalog`（REQ 阶段扩展）

## Claude Code 工具集成

1. **读取输入**
   - `Read` 读取需求文档（如果用户提供了文件路径）
   - `Read` 读取 `references/req_output_schema.json` 和 `references/prompt_templates.md`

2. **创建审查任务**
   ```
   TaskCreate: "Devil-BA review requirements"
   TaskCreate: "Devil-UX review requirements"
   TaskCreate: "Devil-Tech review requirements"
   ```
   或并行调用 3 个 `Agent`，每个携带对应角色 prompt。

3. **执行 Judge 裁决**
   - 使用 `TaskOutput` 收集三个 Devil 的输出
   - 调用 `Agent` 作为 Judge-Req 合并裁决

4. **生成报告**
   - 确保输出 JSON 符合 `references/req_output_schema.json`
   - 调用 `dare-report` Skill 生成可读 Markdown 摘要

## 参考资料

- `references/req_output_schema.json` — 阶段输出 Schema
- `references/prompt_templates.md` — Lv.1-Lv.5 完整 Prompt 模板
- `../dare-core/references/intensity_matrix.md` — 强度矩阵
- `../dare-report/references/unified_schema.json` — 统一输出 Schema
- `../dare-report/references/report_templates/req_report_template.md` — 报告模板
