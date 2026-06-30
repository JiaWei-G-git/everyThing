---
name: dare-test
description: >
  D.A.R.E.框架测试阶段对抗审查（TEST-Challenger）。当测试计划评审、测试代码提交、发布前验收测试、或生产事故复盘后需要补充测试时触发。
  通过 Devil-Test、Devil-Fuzz、Devil-Chaos 和 Judge-Test 挑战覆盖度、生成边界条件、设计故障模拟、发现测试盲区。
  默认强度 Lv.2。
---

# D.A.R.E. 测试阶段对抗审查 (TEST-Challenger)

## 概述

TEST-Challenger 的核心假设是：**开发者的测试必然不完整**。测试验证的是"代码按预期工作"，而非"代码在所有情况下都正确"。TEST-Challenger 的使命是找出被遗漏的"所有情况"。

## 触发条件

- 测试计划评审时
- 测试代码提交时
- 发布前验收测试时
- 生产事故复盘后需要补充回归测试
- CI/CD 流水线中覆盖率下降超过 5%

## 角色定义

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| Devil-Test | 发现测试覆盖盲区 | "这个函数有4个if分支，但测试只覆盖了2个" |
| Devil-Fuzz | 生成边界条件和异常输入 | "如果传入长度为0的数组，这个函数会崩溃吗？" |
| Devil-Chaos | 设计故障注入和恢复验证 | "如果 Redis 在交易过程中宕机，数据一致性如何保证？" |
| Judge-Test | 评估测试充分性 | 基于风险驱动覆盖率模型制定目标 |

## 默认配置

```yaml
default_level: 2
mode: debate
gate_policy:
  critical_gaps: critical_gaps_count > 0 → BLOCKED
  coverage_drop: 覆盖率下降 > 5% → CONDITIONAL
```

## 对抗维度

| 维度 | 目标问题 | 映射到统一 dimension |
|------|----------|---------------------|
| 覆盖度挑战 | 功能、分支、边界覆盖盲区 | `correctness` / `maintainability` |
| 边界条件生成 | 极端输入和状态组合 | `correctness` |
| 故障模拟 | 依赖故障和系统异常 | `reliability` |
| 测试盲区发现 | 并发、时序、竞态条件 | `performance` / `reliability` |

## 风险驱动覆盖率模型

替代简单行覆盖率，按功能风险等级设定差异化目标：

| 功能类型 | 分支覆盖率 | 边界条件 | 故障模拟 |
|----------|-----------|----------|----------|
| 核心功能 | ≥ 90% | 必须 | 必须 |
| 一般功能 | ≥ 75% | 必须 | 建议 |
| 工具/内部功能 | ≥ 60% | 关键路径 | 可选 |

## 输出

输出必须遵循 `references/test_output_schema.json`，该 Schema 已与 `dare-report/references/unified_schema.json` 对齐。

核心字段：
- `record_id`, `stage`, `timestamp`, `intensity_level`
- `review_summary`（字符串，≤200字）
- `issues[]`：每个 issue 包含 `issue_id`, `dimension`, `severity`, `description`, `evidence`, `impact`, `recommendation`
- `scores`: `{ overall, security, maintainability, performance, reliability }`
- `gate_result`: `PASSED` / `CONDITIONAL` / `BLOCKED`
- `confidence_score`: 0.0-1.0
- `test_coverage_assessment`, `missing_test_cases`, `coverage_gaps`, `recommended_coverage_target`（TEST 阶段扩展）

## Claude Code 工具集成

1. **收集输入**
   - `Glob` 发现 `test/` 和 `src/` 文件
   - `Bash` 运行测试并收集覆盖率报告
   - `Read` 读取关键测试代码和被测代码

2. **读取配置**
   - `Read` 读取 `references/test_output_schema.json` 和 `references/prompt_templates.md`

3. **执行审查**
   ```
   TaskCreate: "Devil-Test scan coverage gaps"
   TaskCreate: "Devil-Fuzz generate boundary tests"
   TaskCreate: "Devil-Chaos design fault simulations"
   ```

4. **Judge 裁决**
   - 使用 `TaskOutput` 收集输出
   - 调用 `Agent` 作为 Judge-Test 生成风险驱动覆盖目标

5. **输出**
   - 生成缺失测试用例清单
   - 调用 `dare-report` Skill 生成报告

## 参考资料

- `references/test_output_schema.json` — 阶段输出 Schema
- `references/prompt_templates.md` — Lv.1-Lv.5 完整 Prompt 模板
- `references/boundary_test_patterns.md` — 常见边界条件测试模式
- `references/chaos_scenarios.md` — 故障模拟和混沌工程场景库
- `../dare-core/references/intensity_matrix.md` — 强度矩阵
- `../dare-report/references/unified_schema.json` — 统一输出 Schema
- `../dare-report/references/report_templates/test_report_template.md` — 报告模板
