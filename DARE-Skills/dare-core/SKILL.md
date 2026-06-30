---
name: dare-core
description: >
  D.A.R.E.框架核心编排引擎。协调REQ/ARCH/CODE/TEST四阶段的对抗性AI审查，管理Agent角色分配（Devil批判者、Advocate维护者、Judge裁决者）、辩论流程控制、五级强度阈值和判定收敛。当用户发起对抗性审查请求、配置DARE框架、或需要跨阶段协调对抗流程时触发。支持单Agent自对抗、双Agent辩论和多Agent评审委员会三种编排模式，覆盖从快速日常扫描到关键架构决策的全场景。
---

# D.A.R.E. Core — 对抗编排核心引擎

## 概述

D.A.R.E.（Devil's Advocate Review Engine）通过在REQ、ARCH、CODE、TEST四个阶段嵌入对抗机制，让AI Agent扮演Devil（批判者）、Advocate（维护者）和Judge（裁决者）角色，以结构化辩论暴露方案中的隐性假设、逻辑漏洞和风险盲区。

**本Skill的职责：** 任务分解与编排中枢。不直接执行对抗审查，而是协调各阶段Skill的调用、模式选择、强度配置和流程控制。

## 编排模式选择

根据审查场景特征选择以下三种编排模式之一：

| 模式 | 参与Agent数 | 适用场景 | 成本 | 发现深度 |
|------|-----------|----------|------|----------|
| A: 单Agent自对抗 | 1 | 快速扫描、低成本审查、日常检查 | 低 | 浅 |
| B: 双Agent辩论 | 2 + 1 Judge | 标准审查、发现盲点、中等深度分析 | 中 | 中 |
| C: 多Agent评审委员会 | 3-5 + 1 Judge | 关键决策、全面评估、复杂架构审查 | 高 | 深 |

### 模式选择决策矩阵

| 场景特征 | 推荐模式 | 理由 |
|----------|----------|------|
| 时间紧迫（< 30分钟需结果） | A（单Agent） | 无需协调，响应最快 |
| 日常代码审查 | B（双Agent辩论） | Devil-Code与Devil-Sec分工 |
| 架构评审会前 | C（委员会） | 需要多维度专家视角 |
| 生产事故复盘 | C（委员会） | 复杂根因分析需要多角度交叉验证 |
| 批量历史债务扫描 | A（单Agent） | 低成本覆盖大量存量代码 |

## 对抗强度配置

### 五级对抗强度阈值

| 级别 | 名称 | 语言风格 | 判定标准 | 阻塞性 |
|------|------|----------|----------|--------|
| Lv.1 | 温和模式 | "建议考虑..." / "或许可以思考..." | 仅标记明显问题 | 不阻塞 |
| Lv.2 | 标准模式 | "此方案存在以下缺陷..." / "需要说明理由..." | 要求对中等风险问题提供解释 | 不阻塞，标记警告 |
| Lv.3 | 严格模式 | "必须证明该方案在X场景下的可行性" | 对高风险问题要求穷举反例或提供替代方案 | 阻塞高风险通过 |
| Lv.4 | 激进模式 | "该设计在以下维度存在致命缺陷..." | 多维度同步攻击，要求逐一回应 | 阻塞直到致命问题解决 |
| Lv.5 | 极端模式 | "零容忍：发现以下不可接受的风险..." | 零漏洞容忍，全量攻击面覆盖 | 强制人工介入 |

### 阶段默认强度配置

| 开发阶段 | 推荐默认强度 |
|----------|-------------|
| REQ | Lv.2 |
| ARCH | Lv.3 |
| CODE | Lv.3 |
| TEST | Lv.2 |

**指令：** 在编排审查任务时，首先确定目标阶段，应用对应默认强度。若用户显式指定强度，以用户配置为准。

## 辩论流程控制

### 标准3轮辩论流程

**Round 1 — 初轮攻击：**
- Devil提出初步质疑清单（3-5个核心问题）
- Advocate对每个问题进行初步回应

**Round 2 — 深度辩论：**
- Devil追加证据和反例，强化攻击
- Advocate强化论证或承认部分问题

**Round 3 — 收敛判定：**
- Judge介入，评估证据权重
- 判定Issue成立状态并生成结构化报告

### 收敛条件（满足任一即停止）

1. **共识达成：** 双方对所有Issue意见一致
2. **最大轮次达到配置上限**（默认3轮，可配置1-5轮）
3. **无新论点：** 连续两轮未产生新的实质性论点

## 角色行为规范

### Devil（批判者）行为规范

- 必须引用具体证据（行号、需求ID、架构组件名）
- 禁止人身攻击或空泛质疑
- 每个挑战必须伴随建设性建议
- 承认当自己论据不足时主动退让

### Advocate（维护者）行为规范

- 正面回应对方案的每个质疑
- 提供数据或先例支持自己的辩护
- 当无法辩护时，承认问题并提议修改
- 不捍卫明显错误的决策

### Judge（裁决者）行为规范

- 基于证据权重而非角色立场做判定
- 对每个争议给出明确的成立/驳回/需补充证据结论
- 生成结构化的评分和优先级排序
- 在证据不足时要求补充而非臆断

## 判定评分体系

### 评分维度

| 评分维度 | 权重 | 说明 |
|----------|------|------|
| 证据充分性 | 30% | 是否有具体引用、数据或先例支持 |
| 影响严重性 | 25% | 问题未被解决的后果有多严重 |
| 可修复性 | 20% | 是否有可行的修复或缓解方案 |
| 发生概率 | 15% | 问题在实际场景中发生的可能性 |
| 范围广度 | 10% | 问题影响局部模块还是系统全局 |

### Issue最终判定状态

四级状态体系：
- **Confirmed** — 证据充分，问题成立，必须修复
- **Probable** — 有较大可能性存在，建议修复
- **Disputed** — 证据不足，存在争议，需补充信息
- **Rejected** — 证据不支持，问题不成立

### 评分Prompt模板

当调用Judge角色时，使用以下结构化模板：

```
你作为D.A.R.E.框架的Judge（裁决者），请对以下辩论中的每个Issue进行评分。

评分维度（每项0-10分）：
1. 证据充分性(30%): [Devil提供的证据是否具体、可验证]
2. 影响严重性(25%): [不修复该问题的后果严重程度]
3. 可修复性(20%): [是否存在可行的修复方案]
4. 发生概率(15%): [问题在实际场景中发生的可能性]
5. 范围广度(10%): [影响范围是局部还是全局]

对每个Issue输出以下JSON格式：
{
  "issue_id": "ISSUE-XXX",
  "title": "问题简述",
  "status": "Confirmed/Probable/Disputed/Rejected",
  "scores": {
    "evidence_sufficiency": 0-10,
    "impact_severity": 0-10,
    "fixability": 0-10,
    "occurrence_probability": 0-10,
    "scope_breadth": 0-10
  },
  "weighted_score": 0.0-10.0,
  "reasoning": "判定理由说明",
  "recommendation": "后续行动建议"
}
```

## 触发方式

| 触发方式 | 配置位置 | 适用阶段 |
|----------|----------|----------|
| Git Hook触发 | .git/hooks/ 或 Husky配置 | CODE |
| CI/CD Pipeline触发 | GitHub Actions/GitLab CI/Jenkins | CODE、TEST |
| IDE插件触发 | VSCode/JetBrains插件 | CODE |
| 文档系统Webhook | Notion/Confluence API | REQ、ARCH |
| 定时任务触发 | Cron/Scheduler | 全阶段批量审查 |
| 手动命令触发 | CLI工具 `/dare review` | 全阶段按需 |

## 编排工作流

### Step 1: 接收审查请求

解析用户输入，提取以下参数：
- `stage`: 目标阶段（REQ/ARCH/CODE/TEST）
- `mode`: 编排模式（A/B/C），未指定时根据决策矩阵自动选择
- `intensity`: 对抗强度（Lv.1-Lv.5），未指定时使用阶段默认值
- `max_rounds`: 最大辩论轮次（默认3，范围1-5）
- `input_artifacts`: 待审查的工件（文档、代码、设计图等）

### Step 2: 选择编排模式

根据以下决策树选择模式：

```
时间紧迫(< 30分钟)?
  Y → 模式A（单Agent自对抗）
  N → 关键决策或复杂架构?
    Y → 模式C（多Agent评审委员会）
    N → 模式B（双Agent辩论，默认）
```

### Step 3: 分配Agent角色

**模式A角色分配：**
- 单个Agent兼任Devil和Advocate，采用自问自答形式

**模式B角色分配：**
- Agent 1: Devil（批判者）
- Agent 2: Advocate（维护者）
- Agent 3: Judge（裁决者）— 仅在最终轮介入

**模式C角色分配：**
- Agent 1-2: Devil组（分工覆盖不同维度：安全、性能、可维护性等）
- Agent 3-4: Advocate组（分工辩护不同模块）
- Agent 5: Judge（裁决者）— 仅在最终轮介入

### Step 4: 配置强度参数

将强度级别转换为具体Prompt指令：

```yaml
intensity_prompts:
  lv1: "以温和、建设性的语气提出改进建议，重点关注明显的问题。"
  lv2: "以标准审查语气指出缺陷，要求对方案中的风险点提供解释。"
  lv3: "以严格审查语气质疑方案，要求对高风险问题穷举反例或提供替代方案。"
  lv4: "以激进语气从多个维度同时攻击设计，每个致命缺陷必须逐一回应。"
  lv5: "以零容忍态度全面扫描攻击面，发现任何不可接受的风险都立即标记并强制人工介入。"
```

### Step 5: 执行辩论并收敛

按轮次执行辩论流程，每轮检查收敛条件。满足任一条件时停止辩论。

### Step 6: 生成结构化报告

辩论结束后，由Judge生成最终报告，包含：
- 所有Issue的评分和判定状态
- 按优先级排序的修复建议
- 达成共识的改进项
- 争议未决项及后续建议

## JSON配置Schema

审查任务的完整配置Schema：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DARERequest",
  "type": "object",
  "required": ["stage", "input_artifacts"],
  "properties": {
    "stage": {
      "type": "string",
      "enum": ["REQ", "ARCH", "CODE", "TEST"],
      "description": "审查目标阶段"
    },
    "mode": {
      "type": "string",
      "enum": ["A", "B", "C"],
      "description": "编排模式，不指定时自动选择"
    },
    "intensity": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "description": "对抗强度级别，不指定时使用阶段默认值"
    },
    "max_rounds": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "default": 3,
      "description": "最大辩论轮次"
    },
    "input_artifacts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "content"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text", "code", "url", "file_path"]
          },
          "content": { "type": "string" },
          "metadata": { "type": "object" }
        }
      }
    },
    "focus_areas": {
      "type": "array",
      "items": { "type": "string" },
      "description": "重点关注领域，如安全性、性能、可维护性"
    },
    "convergence_threshold": {
      "type": "string",
      "enum": ["consensus", "max_rounds", "no_new_args"],
      "default": "max_rounds",
      "description": "收敛条件优先级"
    }
  }
}
```

## 跨阶段协调

当用户请求跨多个阶段的综合审查时：

1. 按依赖顺序排列阶段（REQ → ARCH → CODE → TEST）
2. 前一阶段的Confirmed Issue自动作为后一阶段的输入约束
3. 每个阶段独立选择模式和强度
4. 最终汇总报告展示跨阶段依赖关系和累积风险

## 参考文档

- `/mnt/agents/output/dare-core/references/orchestration_patterns.md` — 三种编排模式的详细说明和流程图
- `/mnt/agents/output/dare-core/references/intensity_matrix.md` — 全阶段全强度的详细配置矩阵
- `/mnt/agents/output/dare-core/references/judge_scoring_guide.md` — Judge评分操作指南
