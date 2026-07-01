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

首次使用前，请确保以下目录结构已创建：

```
.dare/
├── records/          # 对抗报告存储（必需）
│   └── 按 dare-YYYYMMDD-NNN.json / .md 格式写入
├── config/           # 项目级配置（可选）
│   └── project_config.json
└── cache/            # 临时缓存（可选）
```

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

## 错误处理与超时策略

当对抗审查流程中出现异常时，按以下策略处理：

| 异常场景 | 处理策略 | 默认值 |
|----------|----------|--------|
| Agent 调用超时 | 记录超时日志，使用已有结果继续，缺失角色的结论标记为 `confidence_score: 0.5` | 单次 Agent 超时：5 分钟 |
| Agent 返回非 JSON | 尝试正则提取关键字段，失败时标记为 `REVIEW_FAILED` | — |
| 文件读取失败 | 跳过该文件，在报告中注明遗漏 | — |
| 历史记录损坏 | 跳过趋势分析，仅生成当前报告 | — |
| 内存/Token 不足 | 降级为 `review` 单 Agent 模式，减少上下文 | — |

**降级决策树：**
```
超时/失败?
  Y → 该角色标记为 UNAVAILABLE
    所有 Devil 均失败? → 终止审查，返回 REVIEW_FAILED
    部分 Devil 失败? → 使用剩余结果继续，置信度下调
    Judge 失败? → 使用 Devil 结论的最高严重级别作为 gate_result
```

## 参考资料

- `references/unified_schema.json` — 统一 JSON Schema
- `references/dashboard_metrics.md` — Dashboard 指标计算方法
- `references/report_templates/` — 四阶段报告模板
- `references/report_generation_prompt.md` — 报告生成 Prompt
- `references/project_config_example.md` — 项目级配置示例
