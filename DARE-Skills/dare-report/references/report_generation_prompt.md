# D.A.R.E. 对抗报告生成 Prompt

## 角色设定
你是对抗报告生成器。根据以下对抗会话记录，生成结构化报告。

## 输入

```yaml
stage: {stage}                          # REQ / ARCH / CODE / TEST
trigger_type: {trigger_type}            # pull_request / commit / manual / scheduled / merge_request / release
trigger_ref: {trigger_ref}              # PR编号 / commit SHA / release tag
intensity_level: {intensity_level}      # 1-5
mode: {mode}                            # debate / review / audit
participants: {participants}            # Agent角色列表
debate_rounds: {debate_rounds}          # 辩论轮次
target: {target}                        # 审查目标对象
issues: {issues_json}                   # 发现的Issue列表（JSON）
scores: {scores}                        # 各维度评分
project_config: {project_config_yaml}   # 项目级配置
```

## 执行步骤

1. **分类排序**：按 `severity`（critical > high > medium > low）和 `dimension` 对 issues 分组排序。
2. **计算综合评分**：`weighted_average(维度评分, 项目配置权重)`。默认权重：security 0.3, maintainability 0.25, performance 0.25, reliability 0.2。
3. **应用 Gate 策略**：根据项目配置的阈值判定 `PASSED` / `CONDITIONAL` / `BLOCKED`。
   - 无 critical/high 且综合评分 ≥ 阈值 → `PASSED`
   - 无 critical 且综合评分略低于阈值 → `CONDITIONAL`
   - 存在 critical 或综合评分远低于阈值 → `BLOCKED`
4. **标记重复 Issue**：按 `dimension + severity + description` 关键词计算相似度，≥80% 标记为 `recurring: true`，并记录 `recurring_count` 和 `first_seen`。
5. **计算指标**：issue_density、critical_issue_ratio、recurring_issue_ratio、fix_duration_hours（如有 resolution 数据）。
6. **生成输出文件**：
   - JSON 报告：`.dare/records/dare-{date}-{seq}.json`
   - Markdown 摘要：`.dare/records/dare-{date}-{seq}.md`

## 输出要求

生成的 JSON 必须符合 `../unified_schema.json` 定义：

- `record_id` 格式：`dare-YYYYMMDD-NNN`
- `stage` 必须是 `REQ` / `ARCH` / `CODE` / `TEST`
- `issues` 数组中每个 issue 必须包含：`issue_id`, `dimension`, `severity`, `description`, `evidence`, `impact`, `recommendation`
- `scores` 必须包含：`overall`, `security`, `maintainability`, `performance`
- `gate_result` 必须是 `PASSED` / `CONDITIONAL` / `BLOCKED`
- `gate_reason` 必须说明判定原因
- `confidence_score` 必须是 0.0-1.0
- `escalation_triggered` 默认为 `false`
- 重复 issue 必须设置 `recurring: true`、`recurring_count`、`first_seen`

Markdown 摘要使用对应阶段的报告模板：`../report_templates/{stage}_report_template.md`。

## 输出示例（顶层结构）

```json
{
  "record_id": "dare-20260630-001",
  "stage": "CODE",
  "timestamp": "2026-06-30T14:32:18Z",
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
  "review_summary": "发现1个critical安全漏洞和2个high性能问题，建议修复后重新审查。",
  "issues": [],
  "scores": {
    "overall": 62,
    "security": 45,
    "maintainability": 78,
    "performance": 38
  },
  "gate_result": "BLOCKED",
  "gate_reason": "1 critical security issue found and security score 45 below threshold 70",
  "confidence_score": 0.95,
  "escalation_triggered": false,
  "escalation_level": null,
  "human_override": null,
  "feedback_score": null,
  "metrics": {
    "issue_density": 12.5,
    "critical_issue_ratio": 0.33,
    "recurring_issue_ratio": 0.0,
    "fix_duration_hours": null
  }
}
```
