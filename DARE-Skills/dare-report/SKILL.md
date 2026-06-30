---
name: dare-report
description: >
  D.A.R.E.框架对抗报告与追踪模块。统一生成REQ/ARCH/CODE/TEST四阶段的结构化对抗报告，
  提供Issue密度趋势、严重Issue占比、平均修复时长、重复Issue率等质量指标计算，
  以及对抗收益比分析。当对抗会话结束需要生成报告、进行质量趋势回顾、
  或计算团队对抗效果度量时触发。
---

# D.A.R.E. Report — 对抗报告与追踪

## Overview

统一对抗报告的生成、存储和追踪，提供质量趋势分析和团队度量指标计算。每次对抗会话结束后，生成结构化JSON报告和可读Markdown摘要，存储到 `.dare/records/` 目录供后续追溯。

## When to Use

- 对抗会话结束，需要生成结构化报告时
- 进行质量趋势回顾，分析Issue密度/严重Issue占比等指标时
- 计算团队对抗效果度量（质量预防率、成本节省、效率提升）时
- 判定Gate结果（PASSED / CONDITIONAL / BLOCKED）时
- 识别重复Issue模式，进行系统性薄弱环节分析时

## Report Generation Workflow

### Step 1: Collect Session Record

收集对抗会话的完整记录，生成如下结构化记录：

```json
{
  "record_id": "dare-20250630-001",
  "timestamp": "2026-06-30T14:32:18Z",
  "stage": "CODE",
  "trigger_type": "pull_request",
  "trigger_ref": "PR#42",
  "intensity_level": 3,
  "mode": "debate",
  "participants": ["Devil-Code", "Devil-Sec", "Judge-Code"],
  "target": {
    "file_path": "src/auth/login.ts",
    "commit_sha": "a1b2c3d"
  },
  "debate_rounds": 3,
  "issues_found": [],
  "scores": {
    "security": 65,
    "maintainability": 78,
    "performance": 82
  },
  "gate_result": "BLOCKED",
  "gate_reason": "1 high severity issue found, exceeds threshold",
  "resolution": {
    "status": "resolved",
    "resolved_by": "developer",
    "resolution_commit": "e4f5g6h"
  }
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `record_id` | string | 格式: `dare-YYYYMMDD-NNN`，唯一标识 |
| `timestamp` | ISO 8601 | 对抗会话结束时间 |
| `stage` | enum | REQ / ARCH / CODE / TEST |
| `trigger_type` | string | pull_request / commit / manual / scheduled |
| `trigger_ref` | string | 触发引用，如PR编号、commit SHA |
| `intensity_level` | integer | 1-5，对抗强度等级 |
| `mode` | enum | debate / review / audit |
| `participants` | string[] | 参与对抗的Agent角色列表 |
| `target` | object | 审查目标（文件路径、commit等） |
| `debate_rounds` | integer | 辩论轮次 |
| `issues_found` | array | 发现的Issue列表 |
| `scores` | object | 各维度评分 |
| `gate_result` | enum | PASSED / CONDITIONAL / BLOCKED |
| `gate_reason` | string | Gate判定原因说明 |
| `resolution` | object | 解决状态追踪 |

### Step 2: Classify and Sort Issues

按以下规则对Issue分类排序：

1. **严重级优先**: critical > high > medium > low
2. **维度分组**: 按审查维度（security/maintainability/performance/reliability）分组
3. **重复标记**: 检索历史记忆，标记重复出现的问题模式

Issue结构：

```json
{
  "issue_id": "CODE-001",
  "dimension": "security",
  "severity": "high",
  "description": "SQL injection vulnerability in user input",
  "evidence": "Line 45: db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)",
  "impact": "Attackers can execute arbitrary SQL commands",
  "recommendation": "Use parameterized queries or prepared statements",
  "location": "src/auth/login.ts:45"
}
```

### Step 3: Calculate Dimension Scores

计算各维度评分（0-100）和综合评分：

```
维度评分 = 100 - Σ(severity_weight × issue_count_in_dimension) - baseline_penalty

severity_weight:
  critical: 25
  high: 15
  medium: 8
  low: 3

综合评分 = weighted_average(维度评分, 权重来自项目配置)
```

权重默认值：security 0.3, maintainability 0.25, performance 0.25, reliability 0.2

### Step 4: Apply Gate Policy

根据项目配置的阈值判定Gate结果：

| 条件 | 结果 | 说明 |
|------|------|------|
| 无critical/high，综合评分≥阈值 | PASSED | 通过，可继续流程 |
| 无critical，综合评分略低于阈值 | CONDITIONAL | 有条件通过，需记录待修复项 |
| 存在critical，或综合评分远低于阈值 | BLOCKED | 阻塞，必须修复后才能继续 |

Gate判定后记录：`gate_result`, `gate_reason`, 以及阈值配置引用。

### Step 5: Detect Recurring Patterns

检索 `.dare/records/` 历史记录，标记重复Issue：

1. 按 `dimension + severity + description_keyword` 计算相似度
2. 相似度≥80%的Issue标记为 `recurring: true`
3. 记录重复次数和首次出现时间
4. 重复Issue率 = 重复Issue数 / 总Issue数

### Step 6: Generate Output

生成两个输出文件：

1. **JSON报告**: `.dare/records/dare-YYYYMMDD-NNN.json` — 完整结构化数据
2. **Markdown摘要**: `.dare/records/dare-YYYYMMDD-NNN.md` — 可读摘要

统一输出Schema见 `/mnt/agents/output/dare-report/references/unified_schema.json`。
各阶段报告模板见 `/mnt/agents/output/dare-report/references/report_templates/`。

## Quality Trend Metrics

计算以下质量趋势指标：

| 指标 | 说明 | 计算公式 |
|------|------|----------|
| Issue密度趋势 | 每千行代码发现问题数的时间序列 | `Issue密度 = Issue总数 / (代码行数/1000)` |
| 严重Issue占比 | Critical/High级别Issue占总Issue比例 | `严重占比 = (critical + high) / 总Issue数 × 100%` |
| 平均修复时长 | Issue从发现到解决的时间 | `平均时长 = Σ(解决时间 - 发现时间) / 已解决Issue数` |
| 重复Issue率 | 同类问题反复出现的频率 | `重复率 = 重复Issue数 / 总Issue数 × 100%` |
| 对抗收益比 | 发现问题价值 / 对抗执行成本 | `收益比 = 预估避免损失 / 对抗执行耗时` |

详细计算方法见 `/mnt/agents/output/dare-report/references/dashboard_metrics.md`。

## Effectiveness Targets

| 指标类别 | 具体指标 | 目标值 |
|----------|----------|--------|
| 质量预防 | 生产Bug中可被对抗发现的占比 | > 60% |
| 成本节省 | 需求阶段发现问题避免的返工成本 | 每个发现节省 > 10x修复成本 |
| 效率提升 | 人工代码审查时间减少比例 | 30-50% |
| 覆盖增强 | 测试边界条件覆盖率提升 | +25% |
| 团队满意度 | 开发者认为对抗"有帮助"的比例 | > 70% |

## Escalation Reserved Fields

为未来升级机制预留以下字段：

| 预留字段 | 类型 | 说明 | 未来用途 |
|----------|------|------|----------|
| `escalation_triggered` | boolean | 是否触发升级 | Critical Issue未修复时通知TL |
| `escalation_level` | enum | L1/L2/L3 | L1通知开发者→L2通知TL→L3通知架构师 |
| `human_override` | object | 人工覆盖记录 | 开发者认为AI判定时有误 |
| `feedback_score` | integer | 1-5 | 收集对抗结果有用性反馈 |

在生成报告时，这些字段应包含在JSON中并设为默认值：

```json
{
  "escalation_triggered": false,
  "escalation_level": null,
  "human_override": null,
  "feedback_score": null
}
```

## Prompt Template

当需要生成对抗报告时，使用以下Prompt模板：

```
你是对抗报告生成器。根据以下对抗会话记录，生成结构化报告。

【输入】
阶段: {stage}
触发类型: {trigger_type}
触发引用: {trigger_ref}
对抗强度: {intensity_level}
参与Agent: {participants}
辩论轮次: {debate_rounds}
发现的Issue: {issues_json}
各维度评分: {scores}

【执行步骤】
1. 按严重级和维度对Issue分类排序
2. 计算综合评分: weighted_average(维度评分, 项目配置权重)
3. 应用Gate策略判定结果(PASSED/CONDITIONAL/BLOCKED)
4. 检索历史记录标记重复Issue模式
5. 生成JSON报告和Markdown摘要
6. 存储到 .dare/records/dare-{date}-{seq}.json 和 .dare/records/dare-{date}-{seq}.md

【输出要求】
- JSON必须符合 unified_schema.json 定义
- Markdown使用对应阶段的报告模板
- 包含gate_result、gate_reason、confidence_score
- 重复Issue标记recurring字段

【项目配置】
{project_config_yaml}
```

## Resources

### references/

Documentation and reference material for report generation:

- `references/unified_schema.json` — 统一JSON Schema完整定义，所有阶段报告必须遵循
- `references/dashboard_metrics.md` — Dashboard指标计算方法和公式
- `references/report_templates/` — 四阶段报告模板（req/arch/code/test）
- `references/project_config_example.md` — 项目级配置文件 `.dare/config.yaml` 完整示例

These files provide detailed specifications and should be referenced when generating reports or calculating metrics.
