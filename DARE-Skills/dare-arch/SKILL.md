---
name: dare-arch
description: >
  D.A.R.E.框架架构阶段对抗审查（ARCH-Challenger）。当技术选型评审、架构设计评审、重大架构变更需要批判性审视时触发。
  通过 Devil-Arch、Devil-Perf、Devil-Sec、Devil-Ops 和 Judge-Arch 挑战技术选型、分析架构脆弱点、评估扩展性、预警技术债务。
  默认强度 Lv.3，推荐多Agent委员会模式。
---

# D.A.R.E. 架构阶段对抗审查 (ARCH-Challenger)

## 概述

架构决策一旦确定，变更成本随时间呈指数增长。ARCH-Challenger 聚焦技术选型、架构模式和设计约束的合理性验证，通过多 Agent 对替代架构方案的系统性比较，揭示单一设计者难以察觉的结构性风险。

## 触发条件

- 技术选型评审会前
- 架构设计评审前
- 重大架构变更时
- 线上故障后架构复盘
- 年度架构健康度检查

## 角色定义

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| Devil-Arch | 挑战架构决策的技术合理性 | "微服务拆分过度，通信成本超过维护收益" |
| Devil-Perf | 挑战架构在负载下的表现 | "当前设计在 QPS 10 万时连接池会耗尽" |
| Devil-Sec | 挑战架构的安全边界和威胁模型 | "该设计假设所有内部服务可信" |
| Devil-Ops | 挑战架构的可运维性 | "需要同时维护 5 种存储系统，运维能否支撑？" |
| Judge-Arch | 综合评估，给出架构健康度评分 | 多维度加权评分 |

## 默认配置

```yaml
default_level: 3
mode: council
roles: [Devil-Arch, Devil-Perf, Devil-Sec, Devil-Ops, Judge-Arch]
gate_policy:
  ahs_threshold:
    < 60 → BLOCKED
    60-80 → CONDITIONAL
    > 80 → PASSED
```

## 对抗维度

| 维度 | 目标问题 | 映射到统一 dimension |
|------|----------|---------------------|
| 技术选型挑战 | 技术栈选择的偏见和未考虑的替代方案 | `maintainability` |
| 架构脆弱点 | 单点故障、级联失败、资源争用 | `reliability` |
| 扩展性评估 | 架构在规模增长时的瓶颈 | `scalability` |
| 技术债务预警 | 短期便利带来的长期维护成本 | `maintainability` |

## 架构健康度评分（AHS）

```
AHS = 0.25 * technical_selection + 0.30 * robustness + 0.25 * scalability + 0.20 * tech_debt
```

AHS 映射到 `scores.overall`，各维度映射到 `scores.maintainability`、`scores.reliability`、`scores.scalability`。

完整计算方法和阈值解读见 `references/ahs_calculation.md`。

## 审查输入要求

为获得最佳效果，架构文档至少应包含：

- [ ] 技术选型说明（含选择理由和排除方案）
- [ ] 架构图（组件关系、数据流、部署拓扑）
- [ ] 接口定义
- [ ] 非功能性需求
- [ ] 已知限制和待决策事项
- [ ] 规模假设

## 输出

输出必须遵循 `references/arch_output_schema.json`，该 Schema 已与 `dare-report/references/unified_schema.json` 对齐。

核心字段：
- `record_id`, `stage`, `timestamp`, `intensity_level`
- `review_summary`（字符串，≤200字）
- `issues[]`：每个 issue 包含 `issue_id`, `dimension`, `severity`, `description`, `evidence`, `impact`, `recommendation`
- `scores`: `{ overall, security, maintainability, performance, reliability, scalability }`
- `gate_result`: `PASSED` / `CONDITIONAL` / `BLOCKED`
- `confidence_score`: 0.0-1.0
- `architecture_health_score` / `dimension_scores`（遗留字段，兼容旧输出）
- `alternative_proposals`（ARCH 阶段扩展）

## Claude Code 工具集成

1. **读取输入**
   - `Read` 读取架构文档
   - `Read` 读取 `references/arch_output_schema.json` 和 `references/prompt_templates.md`

2. **并行审查**
   ```
   TaskCreate: "Devil-Arch review architecture"
   TaskCreate: "Devil-Perf review architecture"
   TaskCreate: "Devil-Sec review architecture"
   TaskCreate: "Devil-Ops review architecture"
   ```

3. **Judge 裁决**
   - 使用 `TaskOutput` 收集四个 Devil 输出
   - 调用 `Agent` 作为 Judge-Arch 计算 AHS 并判定 gate_result

4. **生成报告**
   - 确保输出 JSON 符合 `references/arch_output_schema.json`
   - 调用 `dare-report` Skill 生成报告

## 参考资料

- `references/arch_output_schema.json` — 阶段输出 Schema
- `references/prompt_templates.md` — Lv.1-Lv.5 完整 Prompt 模板
- `references/ahs_calculation.md` — AHS 计算详细说明
- `references/anti_patterns_catalog.md` — 常见架构反模式目录
- `../dare-core/references/intensity_matrix.md` — 强度矩阵
- `../dare-report/references/unified_schema.json` — 统一输出 Schema
- `../dare-report/references/report_templates/arch_report_template.md` — 报告模板
