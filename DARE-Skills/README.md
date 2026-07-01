# D.A.R.E. — Devil's Advocate Review Engine

> 一套覆盖软件全生命周期的对抗性 AI 审查框架，通过在 REQ（需求）、ARCH（架构）、CODE（代码）、TEST（测试）四个阶段嵌入结构化辩论机制，暴露方案中的隐性假设、逻辑漏洞和风险盲区。

---

## 框架概述

D.A.R.E. 框架采用 **Devil（批判者）— Advocate（维护者）— Judge（裁决者）** 三元角色模型，在每个开发阶段引入对抗视角，确保关键决策在固化前经过充分挑战。

**核心理念：**
- 错误发现越早，修复成本越低
- 单一设计者视角必然存在盲区
- 结构化辩论比直觉审查更有效

---

## Skill 集合（7个）

```
                            ┌─────────────────┐
                            │   dare-core     │
                            │  （编排中枢）   │
                            │ 模式选择 · 强度 │
                            │ 配置 · 角色分配 │
                            └────────┬────────┘
                                     │
           ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
           │         │         │           │         │         │
           ▼         ▼         ▼           ▼         ▼         ▼
    ┌─────────┐ ┌─────────┐ ┌─────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │dare-req │ │dare-arch│ │dare-│ │dare-code│ │dare-test│ │dare-    │
    │ 需求审查 │ │ 架构审查 │ │code │ │ 代码审查 │ │ 测试审查 │ │report   │
    │ Lv.2   │ │ Lv.3   │ │     │ │ Lv.3   │ │ Lv.2   │ │ 报告汇总 │
    │ 3 Devil │ │ 4 Devil │ │     │ │ 3 Devil │ │ 3 Devil │ │ 质量追踪 │
    └────┬────┘ └────┬────┘ └─────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │                    │           │           │
         └───────────┴────────────────────┴───────────┴───────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  dare-memory    │
                            │  （记忆管理）   │
                            │  STM短期记忆    │
                            │  LTM长期记忆    │
                            └─────────────────┘
```

| Skill | 职责 | 默认强度 | 推荐模式 | 触发场景 |
|-------|------|---------|---------|---------|
| **dare-core** | 编排中枢：模式选择、强度配置、角色分配、跨阶段协调 | — | — | 任何对抗审查请求 |
| **dare-req** | 需求阶段审查：隐性假设、需求矛盾、ROI、范围蔓延 | Lv.2 | debate | 需求评审、PR变更 |
| **dare-arch** | 架构阶段审查：技术选型、脆弱点、扩展性、技术债务 | Lv.3 | council | 架构评审、技术选型 |
| **dare-code** | 代码阶段审查：实现方案、安全漏洞、可维护性、性能 | Lv.3 | debate | PR创建、合并前审查 |
| **dare-test** | 测试阶段审查：覆盖盲区、边界条件、故障模拟、测试盲区 | Lv.2 | debate | 测试计划评审、CI覆盖率下降 |
| **dare-report** | 报告与追踪：统一报告、质量趋势、团队度量 | — | — | 对抗会话结束、趋势回顾 |
| **dare-memory** | 记忆管理：短期记忆(STM)、长期记忆(LTM)、历史注入 | — | — | 所有会话启动/结束 |

---

## 快速开始

### 场景一：审查一份需求文档

```
用户：请审查这份需求文档

1. 激活 dare-core → 解析请求 → 确定 stage=REQ, mode=debate, level=2
2. 激活 dare-req → 并行调用 Devil-BA + Devil-UX + Devil-Tech
3. 激活 dare-memory → 检索历史相关假设注入上下文
4. 调用 Judge-Req 汇总裁决
5. 激活 dare-report → 生成结构化报告
6. 激活 dare-memory → 将结论迁移到长期记忆
```

### 场景二：PR 合并前代码审查

```
触发：Pull Request 创建

1. 激活 dare-core → stage=CODE, mode=debate, level=3
2. 检查路径是否命中安全敏感模式 → 命中则自动升级至 Lv.4 + council
3. 激活 dare-code → 并行调用 Devil-Code + Devil-Sec + Devil-Maint
4. 激活 dare-memory → 检索同类代码历史问题
5. 调用 Judge-Code → 计算 scores + 判定 gate_result
6. gate_result == BLOCKED → 阻塞合并，生成修复清单
7. 激活 dare-report → 输出 PR 评论格式报告
```

### 场景三：跨阶段综合审查

```
用户：请对项目进行一次全面审查

1. 激活 dare-core → 按顺序：REQ → ARCH → CODE → TEST
2. 每阶段独立选择模式和强度，遵循阶段间强度继承规则
3. 前一阶段 Confirmed Issue 作为后一阶段输入约束
4. 最终 dare-report 汇总跨阶段依赖和累积风险
```

---

## 目录结构

```
DARE-Skills/
├── dare-core/
│   ├── SKILL.md
│   └── references/
│       ├── request_schema.json       # 请求配置 Schema
│       ├── intensity_matrix.md       # 全阶段全强度配置矩阵
│       ├── orchestration_patterns.md # 三种编排模式详细说明
│       └── judge_scoring_guide.md    # Judge 评分操作指南
├── dare-req/
│   ├── SKILL.md
│   └── references/
│       ├── req_output_schema.json    # REQ 阶段输出 Schema
│       └── prompt_templates.md       # Lv.1-Lv.5 Prompt 模板
├── dare-arch/
│   ├── SKILL.md
│   └── references/
│       ├── arch_output_schema.json   # ARCH 阶段输出 Schema
│       ├── ahs_calculation.md        # AHS 计算说明
│       ├── anti_patterns_catalog.md  # 架构反模式目录
│       └── prompt_templates.md
├── dare-code/
│   ├── SKILL.md
│   └── references/
│       ├── code_output_schema.json   # CODE 阶段输出 Schema
│       ├── cwe_classification.md     # CWE 分类参考
│       ├── github_action_template.md # GitHub Actions 集成模板
│       ├── gitlab_ci_template.md     # GitLab CI 集成模板
│       └── prompt_templates.md
├── dare-test/
│   ├── SKILL.md
│   └── references/
│       ├── test_output_schema.json   # TEST 阶段输出 Schema
│       ├── boundary_test_patterns.md # 边界条件测试模式
│       ├── chaos_scenarios.md        # 混沌工程场景库
│       └── prompt_templates.md
├── dare-report/
│   ├── SKILL.md
│   └── references/
│       ├── unified_schema.json       # 统一输出 Schema（所有阶段共用）
│       ├── dashboard_metrics.md      # Dashboard 指标计算
│       ├── report_generation_prompt.md
│       ├── project_config_example.md
│       └── report_templates/         # 四阶段报告模板
│           ├── req_report_template.md
│           ├── arch_report_template.md
│           ├── code_report_template.md
│           └── test_report_template.md
├── dare-memory/
│   ├── SKILL.md
│   └── references/
│       ├── stm_schema.md             # 短期记忆 Schema
│       ├── ltm_schema.md             # 长期记忆 Schema
│       └── retrieval_prompts.md      # 检索场景 Prompt 模板
├── plan.md                           # 框架创建计划
├── dare_review_report.md             # 框架审查报告
└── README.md                         # 本文件
```

---

## 关键概念速查

| 概念 | 说明 |
|------|------|
| **Devil** | 批判者角色，负责提出挑战和质疑 |
| **Advocate** | 维护者角色，负责辩护和回应质疑 |
| **Judge** | 裁决者角色，基于证据权重做最终判定 |
| **review** | 单 Agent 自对抗模式，快速低成本 |
| **debate** | 双 Agent 辩论模式，标准审查 |
| **council** | 多 Agent 评审委员会，关键决策 |
| **audit** | 深度审计模式，上线前最终审查 |
| **AHS** | 架构健康度评分 (Architecture Health Score) |
| **Gate** | 合并阻塞条件，判定 PASSED / CONDITIONAL / BLOCKED |
| **STM** | 短期记忆，单会话内共享 |
| **LTM** | 长期记忆，跨会话持久化 |

---

## 阶段间强度继承规则

当跨阶段综合审查时，前一阶段的 Confirmed Issue 会触发后一阶段的最低强度要求：

```
REQ Confirmed Issue → ARCH 自动至少 Lv.3
ARCH Confirmed Issue → CODE 自动至少 Lv.4
CODE Confirmed Issue → TEST 自动至少 Lv.3
```

用户显式指定更高强度时，以用户配置为准。

---

## 使用约束

1. **安装时必须保持上述目录结构**，各 Skill 之间通过相对路径引用共享文件（如统一 Schema）
2. **首次使用前** 确保 `.dare/records/` 目录已创建，用于存储报告
3. 每个 Skill 的 `references/` 目录包含该阶段所需的全部模板和 Schema，可直接使用
4. 强度级别（Lv.1-Lv.5）和模式选择应结合实际场景，详见 `dare-core/references/intensity_matrix.md`

---

## 版本信息

- 框架版本：v1.0
- 创建日期：2026-06-30
- 覆盖阶段：REQ / ARCH / CODE / TEST
- 编排模式：review / debate / council / audit
- 强度级别：Lv.1（温和）— Lv.5（极端）
