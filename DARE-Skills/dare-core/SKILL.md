---
name: dare-core
description: >
  D.A.R.E.框架核心编排引擎。当用户发起对抗性审查请求、配置DARE框架、或需要跨阶段协调REQ/ARCH/CODE/TEST对抗流程时触发。
  负责任务分解、模式选择、强度配置、Agent角色分配和流程控制。
---

# D.A.R.E. Core — 对抗编排核心引擎

## 概述

D.A.R.E.（Devil's Advocate Review Engine）通过在 REQ、ARCH、CODE、TEST 四个阶段嵌入对抗机制，让 AI Agent 扮演 Devil（批判者）、Advocate（维护者）和 Judge（裁决者）角色，以结构化辩论暴露方案中的隐性假设、逻辑漏洞和风险盲区。

本 Skill 是编排中枢：不直接执行对抗审查，而是协调各阶段 Skill 的调用、模式选择、强度配置和流程控制。

## 触发条件

当以下任一情况出现时激活本 Skill：

- 用户请求"对这段代码/需求/架构/测试进行对抗审查"
- 用户配置 DARE 框架参数（强度、模式、阶段）
- 用户请求跨多个阶段的综合审查
- 其他阶段 Skill 需要确定编排模式和角色分配

## 编排模式

根据审查场景选择以下模式之一：

| 模式 | 参与Agent数 | 适用场景 | 成本 | 发现深度 |
|------|------------|----------|------|----------|
| `review` | 1 | 单Agent自对抗，快速扫描、低成本审查、日常检查 | 低 | 浅 |
| `debate` | 2 + 1 Judge | 双Agent辩论，标准审查、发现盲点 | 中 | 中 |
| `council` | 3-5 + 1 Judge | 多Agent评审委员会，关键决策、复杂架构审查 | 高 | 深 |
| `audit` | 2-3 + 1 Judge | 深度审计，上线前最终审查、安全加固 | 高 | 深 |

### 模式选择决策树

```
时间紧迫(< 30分钟需结果)?
  Y → review（单Agent自对抗）
  N → 关键决策或复杂架构?
    Y → council（多Agent评审委员会）
    N → 上线前最终审查?
      Y → audit（深度审计）
      N → debate（双Agent辩论，默认）
```

## 对抗强度

五级强度阈值定义见 `references/intensity_matrix.md`。阶段默认强度：

| 阶段 | 默认强度 |
|------|---------|
| REQ | Lv.2 |
| ARCH | Lv.3 |
| CODE | Lv.3 |
| TEST | Lv.2 |

用户显式指定时以用户配置为准。

## 标准辩论流程

1. **Round 1 初轮攻击**：Devil 提出 3-5 个核心问题，Advocate 初步回应
2. **Round 2 深度辩论**：Devil 追加证据和反例，Advocate 强化论证或承认部分问题
3. **Round 3 收敛判定**：Judge 评估证据权重，判定 Issue 成立状态

收敛条件（满足任一即停止）：共识达成 / 达到最大轮次（默认3轮，可配置1-5轮）/ 连续两轮无新论点。

## 角色行为规范

- **Devil**：必须引用具体证据，禁止空泛质疑，每个挑战必须伴随建设性建议
- **Advocate**：正面回应每个质疑，提供数据或先例支持，无法辩护时承认问题
- **Judge**：基于证据权重判定，对每个争议给出 Confirmed/Probable/Disputed/Rejected 结论

## 判定评分体系

Judge 对每个 Issue 按以下维度评分（每项 0-10）：

| 维度 | 权重 |
|------|------|
| 证据充分性 | 30% |
| 影响严重性 | 25% |
| 可修复性 | 20% |
| 发生概率 | 15% |
| 范围广度 | 10% |

评分操作指南见 `references/judge_scoring_guide.md`。

## 输入参数

请求配置 Schema 见 `references/request_schema.json`：

```yaml
stage: REQ | ARCH | CODE | TEST
mode: debate | review | audit | council  # 可选，默认自动选择
intensity_level: 1-5                      # 可选，默认阶段默认值
max_rounds: 1-5                           # 可选，默认3
input_artifacts:                          # 待审查工件列表
  - type: text|code|url|file_path
    content: "..."
focus_areas: [security, performance, maintainability]  # 可选
convergence_threshold: consensus|max_rounds|no_new_args  # 可选，默认max_rounds
```

## 输出

输出由对应阶段 Skill 生成，所有阶段输出必须遵循 `dare-report/references/unified_schema.json`。

## Claude Code 工具集成

当用户发起对抗审查请求时：

1. **解析请求**
   - 使用 `Read` 读取 `references/request_schema.json` 了解输入格式
   - 从用户消息中提取 `stage`、`mode`、`intensity_level`、`input_artifacts`

2. **选择编排模式**
   - 未指定 `mode` 时，应用上述决策树
   - 未指定 `intensity_level` 时，应用阶段默认值

3. **分配 Agent 角色**
   - `review`：单个 Agent 兼任 Devil 和 Advocate
   - `debate`：Devil + Advocate（由方案作者或维护者 Agent 担任）+ Judge
   - `council`：Devil 组（2-3 人）+ Advocate 组（1-2 人，可由不同视角维护者组成）+ Judge
   - `audit`：Devil-Sec/Devil-Code + Advocate（代码/方案作者）+ Judge

   Advocate 职责：正面回应每个质疑，提供数据或先例支持；无法辩护时承认问题；主动补充被 Devil 遗漏的正面论据。

4. **创建并行审查任务**
   ```
   TaskCreate: "Devil-Code review src/auth/login.ts"
   TaskCreate: "Devil-Sec review src/auth/login.ts"
   ```
   或使用 `Agent` 直接调用对应阶段 Skill（如 `dare-code`）。

5. **收集结果并裁决**
   - 使用 `TaskOutput` 或等待 Agent 返回
   - 调用 Judge Agent 汇总评分、判定 gate_result

6. **生成报告**
   - 使用 `Read` 读取 `dare-report/references/unified_schema.json`
   - 调用 `dare-report` Skill 生成结构化报告

## 跨阶段协调

当用户请求跨多个阶段的综合审查时：

1. 按依赖顺序排列阶段：REQ → ARCH → CODE → TEST
2. 前一阶段的 Confirmed Issue 自动作为后一阶段的输入约束
3. 每个阶段独立选择模式和强度，**同时遵循阶段间强度自动继承规则**：
   - REQ 阶段发现 Confirmed Issue → ARCH 阶段自动最低 Lv.3
   - ARCH 阶段发现 Confirmed Issue → CODE 阶段自动最低 Lv.4
   - CODE 阶段发现 Confirmed Issue → TEST 阶段自动最低 Lv.3
   - 若用户显式指定了更高强度，以用户配置为准
4. 最终由 `dare-report` 汇总跨阶段依赖关系和累积风险

## 参考资料

- `references/request_schema.json` — 请求配置 Schema
- `references/intensity_matrix.md` — 全阶段全强度详细配置矩阵
- `references/orchestration_patterns.md` — 三种编排模式详细说明
- `references/judge_scoring_guide.md` — Judge 评分操作指南
- `../dare-report/references/unified_schema.json` — 统一输出 Schema
