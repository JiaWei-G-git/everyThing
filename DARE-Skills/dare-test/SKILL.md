---
name: dare-test
description: >
  D.A.R.E.框架测试阶段对抗审查（TEST-Challenger）。通过Devil-Test（测试批判者）、
  Devil-Fuzz（模糊测试者）、Devil-Chaos（混沌工程者）和Judge-Test（测试裁决者）四个角色，
  对测试计划和测试代码进行覆盖度挑战、边界条件生成、故障模拟和测试盲区发现。
  当测试计划评审、测试代码提交、发布前验收测试、或生产事故复盘后需要补充测试时触发。
  默认强度Lv.2。
---

# DARE-Test: TEST-Challenger — 测试阶段对抗审查

## Overview

TEST-Challenger 是 D.A.R.E. 框架（Devil's Adversarial Review Engine）的测试阶段专用对抗审查工具。它通过四个专项角色对测试代码和测试计划进行系统性批判，发现测试盲区、生成边界条件用例、设计故障模拟方案，并以风险驱动覆盖率模型替代简单的行覆盖率指标。

核心假设：**开发者的测试必然不完整**——测试验证的是"代码按预期工作"，而非"代码在所有情况下都正确"。TEST-Challenger 的使命是找出被遗漏的"所有情况"。

---

## 对抗维度与目标

| 对抗维度 | 目标问题 | 典型遗漏场景 |
|----------|----------|-------------|
| 覆盖度挑战 | 功能、分支、边界覆盖的盲区在哪里 | 只测试了正常路径，未覆盖异常分支；else分支从未被测试 |
| 边界条件生成 | 极端输入和状态组合的测试是否充分 | 未测试最大值+1、最小值-1、空值、特殊字符、Unicode边界 |
| 故障模拟 | 依赖故障和系统异常的测试是否到位 | 未模拟下游服务超时、数据库连接断开、缓存雪崩 |
| 测试盲区发现 | 测试未覆盖的隐性逻辑路径有哪些 | 并发场景、时序依赖、竞态条件、隐式默认分支 |

---

## 角色定义

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| **Devil-Test** | 发现测试覆盖盲区，生成缺失用例 | "这个函数有4个if分支，但测试只覆盖了2个" |
| **Devil-Fuzz** | 生成边界条件和异常输入 | "如果传入长度为0的数组，这个函数会崩溃吗？" |
| **Devil-Chaos** | 设计故障注入和恢复验证方案 | "如果Redis在交易过程中宕机，数据一致性如何保证？" |
| **Judge-Test** | 评估测试充分性，给出覆盖率目标建议 | 基于风险驱动的覆盖率策略制定 |

### 角色协作模式

**单Agent快速扫描**（默认 Lv.2）: 一个角色独立执行完整审查，输出JSON报告。

**双Agent辩论**（推荐 Lv.2）: Devil-Test 提出缺陷，Judge-Test 质疑并裁决。

**多Agent委员会**（推荐 Lv.3）: 三个Devil独立审查，Judge-Test综合裁决。

详细Prompt模板见: `/mnt/agents/output/dare-test/references/prompt_templates.md`

---

## Lv.2 Prompt 模板（默认推荐强度）

Lv.2 Standard Challenge 是默认推荐保守强度，适用于日常代码审查和测试提交。

### Devil-Test Lv.2 模板

```markdown
## 角色设定
你是一位Devil-Test（测试批判者），审查以下测试计划和代码。
你的假设是：开发者的测试必然不完整，你的任务是找出他们遗漏了什么。

## 对抗强度: Level 2 (Standard Challenge)
- 系统性地审查所有分支和边界条件
- 边界条件: 等价类划分 + 边界值分析
- 故障模拟: 必须包含超时模拟
- 并发测试: 建议（标记风险点但不强制）
- 覆盖率目标: 分支覆盖 >= 75%，功能覆盖 100%
- 聚焦: 确认偏误检测——挑战"测试验证了预期行为"的假设

## 审查输入
[注入测试计划、测试代码、被测功能说明]

## 审查维度
1. **覆盖度挑战**: 功能覆盖 / 分支覆盖 / 异常覆盖
2. **边界条件生成**: 每个输入参数的边界值 / 状态转换边界 / 数据量极限测试
3. **故障模拟**: 外部依赖故障设计 / 超时、拒绝服务、数据不一致模拟 / 故障恢复验证
4. **测试盲区发现**: 并发访问 / 时序和竞态条件 / 配置变更影响

## 输出格式
严格按照 JSON Schema 输出:
`/mnt/agents/output/dare-test/references/test_output_schema.json`
```

### Devil-Fuzz Lv.2 模板

```markdown
## 角色设定
你是一位Devil-Fuzz（模糊测试者），审查以下测试代码。
你的假设是：开发者只用"正常"数据测试，从未考虑极端输入。

## 对抗强度: Level 2 (Standard Challenge)
- 对每个函数的每个参数应用等价类+边界值分析
- 数值: MIN-1, MIN, MIN+1, 0, MAX-1, MAX, MAX+1
- 字符串: null, empty, 1 char, max length, max+1, special chars
- 数组: null, empty [], single element, max size, max+1
- 每个参数至少识别2个未测试边界

## 审查输入
[注入测试代码、被测函数签名、参数类型说明]

## 输出格式
严格按照 JSON Schema 输出:
`/mnt/agents/output/dare-test/references/test_output_schema.json`
```

### Devil-Chaos Lv.2 模板

```markdown
## 角色设定
你是一位Devil-Chaos（混沌工程者），审查以下测试计划和代码。
你的假设是：外部依赖永远不会100%可靠，但测试假设它们总是正常响应。

## 对抗强度: Level 2 (Standard Challenge)
- 识别所有外部依赖（数据库、HTTP API、缓存、消息队列、文件系统）
- 对每个依赖设计至少一个超时故障模拟
- 验证故障发生时的系统行为（降级/重试/返回缓存/报错）
- 最小要求: 每个外部依赖至少1个超时场景

## 审查输入
[注入测试代码、被测代码、架构依赖图]

## 输出格式
严格按照 JSON Schema 输出:
`/mnt/agents/output/dare-test/references/test_output_schema.json`
```

### Judge-Test Lv.2 模板

```markdown
## 角色设定
你是一位Judge-Test（测试裁决者），评估以下测试的充分性。
你的假设是：行覆盖率是一个谎言，真正的测试质量取决于风险覆盖。

## 对抗强度: Level 2 (Standard Challenge)
- 按风险驱动覆盖率模型对功能分类（核心/一般/工具）
- 核心功能: 分支>=90%, 边界100%, 故障模拟必须
- 一般功能: 分支>=75%, 边界100%, 故障模拟建议
- 工具功能: 分支>=60%, 关键路径覆盖, 故障可选
- 生成 recommended_coverage_target

## 审查输入
[注入测试代码、覆盖率报告、功能风险等级说明]

## 输出格式
严格按照 JSON Schema 输出:
`/mnt/agents/output/dare-test/references/test_output_schema.json`
```

---

## 风险驱动覆盖率模型

替代简单行覆盖率，按功能风险等级设定差异化覆盖目标：

| 功能类型 | 分支覆盖率要求 | 边界条件 | 故障模拟 |
|----------|--------------|----------|----------|
| 核心功能（支付、认证、权限、数据持久化） | >= 90% | 必须100%覆盖已识别风险点 | 必须 |
| 一般功能（业务逻辑、数据处理） | >= 75% | 必须100%覆盖已识别风险点 | 建议 |
| 工具/内部功能（日志、配置、辅助函数） | >= 60% | 关键路径覆盖 | 可选 |

### 风险等级判定标准

**核心功能**（Tier 1）:
- 涉及资金流转或用户身份验证
- 失败会导致数据丢失或不可逆状态变更
- 有合规或审计要求
- 生产事故历史中有P0/P1级故障

**一般功能**（Tier 2）:
- 业务逻辑处理但不涉及资金/身份
- 失败可回滚或补偿
- 有用户可见影响但不致命

**工具/内部功能**（Tier 3）:
- 不直接影响用户可见行为
- 纯内部使用，有替代实现
- 失败影响范围限于内部运维

---

## 触发时机

| 触发时机 | 推荐模式 | 强度 |
|----------|----------|------|
| 测试计划评审时 | 双Agent辩论（Devil-Test vs Judge-Test） | Lv.2 |
| 测试代码提交时 | 单Agent快速扫描 | Lv.2 |
| 发布前验收测试 | 多Agent委员会 | Lv.3 |
| 生产事故复盘后 | 定向对抗 | Lv.4 |
| 安全关键系统审查 | 全Agent委员会 | Lv.5 |

### 触发信号（自动激活条件）

当以下任一条件出现时，自动激活 TEST-Challenger:

1. 代码审查中出现 `test/` 目录的变更
2. Pull Request 描述中包含 "test"、"testing"、"coverage" 关键词
3. 用户显式请求测试审查（"帮我看看测试够不够"、"补充测试用例"）
4. CI/CD 流水线中覆盖率下降超过5%
5. 生产事故复盘后需要补充回归测试
6. 发布前验收测试阶段

---

## 全强度差异矩阵

| 强度 | 名称 | 边界条件 | 故障模拟 | 并发测试 | 覆盖率目标 | 适用场景 |
|------|------|----------|----------|----------|-----------|----------|
| Lv.1 | Gentle Probe | 最值测试（min/max/null） | 无 | 无 | 功能覆盖 | 快速冒烟、原型、内部工具 |
| **Lv.2** | **Standard Challenge** | **等价类+边界** | **超时模拟** | **建议** | **分支75%** | **日常审查、测试提交（默认）** |
| Lv.3 | Deep Scrutiny | 全边界组合 | 依赖故障 | 要求 | 分支85% | 发布验收、核心模块变更 |
| Lv.4 | Adversarial Assault | 模糊测试输入 | 混沌工程 | 压力测试 | 分支90%+变异测试 | 事故复盘、安全关键系统 |
| Lv.5 | Formal Verification | 全输入空间 | 全故障注入 | 形式化验证 | 100%（关键路径） | 航空/医疗/加密货币核心 |

### 强度选择决策树

```
测试计划评审? ──Yes──> 双Agent辩论 ──Lv.2
     │
     No
     │
测试代码提交? ──Yes──> 单Agent扫描 ──Lv.2
     │
     No
     │
发布前验收? ──Yes──> 多Agent委员会 ──Lv.3
     │
     No
     │
事故复盘? ──Yes──> 定向对抗 ──Lv.4
     │
     No ──> 默认 ──Lv.2
```

---

## 审查执行流程

### Step 1: 输入收集

收集以下输入材料：
- 被测源代码（关键函数和模块）
- 现有测试代码
- 功能需求说明或API文档
- （可选）当前覆盖率报告
- （可选）架构依赖图

### Step 2: 角色分配

根据触发时机和强度选择角色组合：
- Lv.1-Lv.2: 单角色或双角色辩论
- Lv.3: 三Devil + Judge委员会
- Lv.4-Lv.5: 全角色 + 定向对抗

### Step 3: 对抗审查

每个角色按Prompt模板执行审查：
1. Devil-Test: 扫描分支覆盖，生成缺失用例
2. Devil-Fuzz: 分析参数边界，生成边界测试
3. Devil-Chaos: 识别依赖，设计故障场景
4. Judge-Test: 综合评估，制定覆盖目标

### Step 4: 输出整合

Judge-Test 整合所有角色输出，去重定级，生成最终报告。

### Step 5: 结果交付

输出符合JSON Schema的结构化报告，包含：
- `test_coverage_assessment`: 四维覆盖评估
- `missing_test_cases[]`: 具体缺失用例清单
- `coverage_gaps[]`: 系统性覆盖缺口
- `recommended_coverage_target`: 风险驱动目标

完整JSON Schema定义: `/mnt/agents/output/dare-test/references/test_output_schema.json`

---

## References

| 文件 | 内容 | 用途 |
|------|------|------|
| `/mnt/agents/output/dare-test/references/test_output_schema.json` | 测试阶段完整JSON输出Schema | 所有角色审查输出的格式规范 |
| `/mnt/agents/output/dare-test/references/prompt_templates.md` | Lv.1-Lv.5全部Prompt模板 | 按强度选择对应Prompt |
| `/mnt/agents/output/dare-test/references/boundary_test_patterns.md` | 常见边界条件测试模式参考 | Devil-Fuzz生成边界用例时参考 |
| `/mnt/agents/output/dare-test/references/chaos_scenarios.md` | 故障模拟和混沌工程场景库 | Devil-Chaos设计故障场景时参考 |

---

## 使用示例

### 示例1: 测试代码提交审查

```
用户: "提交了用户注册模块的测试，帮我审查一下"

激活: TEST-Challenger Lv.2 单Agent快速扫描
角色: Devil-Test + Devil-Fuzz + Devil-Chaos 顺序执行
输出: JSON格式审查报告，包含缺失的分支测试、边界测试、故障模拟
```

### 示例2: 发布前验收

```
用户: "准备发布了，测试充分吗？"

激活: TEST-Challenger Lv.3 多Agent委员会
角色: 三Devil独立审查 + Judge综合裁决
输出: 覆盖率评估 + 风险热力图 + 必须修复的阻断项
```

### 示例3: 生产事故复盘

```
用户: "昨天支付超时导致订单重复，需要补充测试"

激活: TEST-Challenger Lv.4 定向对抗
角色: Devil-Chaos主导故障复现 + Devil-Test验证防御
输出: 定向测试用例 + 故障注入方案 + 回归测试套件
```

---

## 输出 JSON 关键字段说明

所有角色审查输出必须包含以下顶级字段：

- `review_metadata`: 审查会话元数据（review_id, timestamp, reviewer_role, adversarial_level）
- `test_coverage_assessment`: 四维覆盖评估
  - `functional_coverage`: 功能覆盖（score/max_score/percentage/findings）
  - `branch_coverage`: 分支覆盖（score/max_score/percentage/uncovered_branches）
  - `boundary_coverage`: 边界覆盖（score/max_score/percentage/untested_boundaries）
  - `fault_coverage`: 故障覆盖（score/max_score/percentage/untested_faults）
- `missing_test_cases[]`: 缺失测试用例（case_id, target_function, test_type, scenario, input_data, expected_behavior, priority, rationale）
- `coverage_gaps[]`: 系统性覆盖缺口（gap_id, category, description, affected_areas, risk_level, remediation）
- `recommended_coverage_target`: 风险驱动目标（overall_strategy, targets_by_risk_tier[], priority_actions[]）
- `summary`: 汇总（total_missing_cases, critical_gaps_count, overall_risk_level, key_recommendation）

完整Schema: `/mnt/agents/output/dare-test/references/test_output_schema.json`
