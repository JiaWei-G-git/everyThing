---
name: dare-report
description: >
  D.A.R.E.框架对抗报告与追踪模块。当对抗会话结束需要生成报告、进行质量趋势回顾、计算团队对抗效果度量、或判定Gate结果时触发。
  统一汇总REQ/ARCH/CODE/TEST四阶段的结构化对抗报告。
---

# D.A.R.E. Report — 对抗报告与追踪

## 概述

统一对抗报告的生成、存储和追踪，提供质量趋势分析和团队度量指标计算。每次对抗会话结束后，生成结构化 JSON 报告和可读 Markdown 摘要，存储到 `.dare/records/` 目录供后续追溯。

## 触发条件

- 对抗会话结束，需要生成结构化报告
- 进行质量趋势回顾（Issue 密度、严重 Issue 占比等）
- 计算团队对抗效果度量
- 判定 Gate 结果（PASSED / CONDITIONAL / BLOCKED）
- 识别重复 Issue 模式

## 输入

来自任一阶段 Skill 的输出 JSON，必须遵循 `references/unified_schema.json`：

```json
{
  "record_id": "dare-20260630-001",
  "stage": "CODE",
  "timestamp": "2026-06-30T14:32:18Z",
  "intensity_level": 3,
  "mode": "debate",
  "participants": ["Devil-Code", "Devil-Sec", "Judge-Code"],
  "target": { "file_path": "src/auth/login.ts", "commit_sha": "a1b2c3d" },
  "debate_rounds": 3,
  "issues": [],
  "scores": { "overall": 72, "security": 65, "maintainability": 78, "performance": 82 },
  "gate_result": "BLOCKED"
}
```

## 输出

生成两个文件：

1. `.dare/records/dare-YYYYMMDD-NNN.json` — 完整结构化数据
2. `.dare/records/dare-YYYYMMDD-NNN.md` — 可读摘要

统一输出 Schema 见 `references/unified_schema.json`，阶段报告模板见 `references/report_templates/`。

## 报告生成工作流

1. **收集会话记录** — 读取阶段 Skill 的输出 JSON
2. **分类排序** — 按 severity 和 dimension 对 issues 排序
3. **计算评分** — 加权平均各维度评分
4. **应用 Gate 策略** — 判定 PASSED / CONDITIONAL / BLOCKED
5. **检测重复模式** — 对比 `.dare/records/` 历史记录标记 recurring issues
6. **生成文件** — 输出 JSON 和 Markdown

## 质量趋势指标

| 指标 | 说明 | 计算 |
|------|------|------|
| Issue 密度 | 每千行代码问题数 | Issue总数 / (代码行数/1000) |
| 严重 Issue 占比 | critical/high 占比 | (critical + high) / 总数 × 100% |
| 平均修复时长 | 发现到解决的时间 | Σ(解决时间 - 发现时间) / 已解决数 |
| 重复 Issue 率 | 同类问题反复出现频率 | 重复Issue数 / 总数 × 100% |
| 对抗收益比 | 发现问题价值 / 执行成本 | 预估避免损失 / 执行耗时 |

详细公式见 `references/dashboard_metrics.md`。

## 升级预留字段

报告包含以下升级相关字段：

- `escalation_triggered`: boolean
- `escalation_level`: L1/L2/L3
- `human_override`: object
- `feedback_score`: 1-5

## Claude Code 工具集成

1. **读取输入**
   - `Read` 读取阶段 Skill 的输出 JSON
   - `Read` 读取 `references/unified_schema.json` 和对应阶段报告模板

2. **读取历史记录**
   - `Glob` 发现 `.dare/records/*.json`
   - `Read` 读取近期记录以检测重复模式

3. **生成报告**
   - 调用 `Agent` 作为报告生成器，使用 `references/report_generation_prompt.md`
   - 或使用 `Write` 直接写入 `.dare/records/dare-YYYYMMDD-NNN.json` 和 `.md`

4. **趋势分析**
   - `Bash` 运行脚本计算 Issue 密度、严重 Issue 占比等指标
   - 输出趋势图表或表格

## 参考资料

- `references/unified_schema.json` — 统一 JSON Schema
- `references/dashboard_metrics.md` — Dashboard 指标计算方法
- `references/report_templates/` — 四阶段报告模板
- `references/report_generation_prompt.md` — 报告生成 Prompt
- `references/project_config_example.md` — 项目级配置示例
