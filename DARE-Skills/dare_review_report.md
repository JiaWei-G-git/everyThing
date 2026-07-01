# D.A.R.E. 框架 Skill 集合 — 全面审查报告

> 审查范围：dare-core / dare-memory / dare-req / dare-arch / dare-code / dare-test / dare-report
> 审查维度：文件完整性、Schema一致性、跨Skill一致性、逻辑正确性、工具引用准确性、内容可优化性

---

## 1. 执行摘要

| 维度 | 结论 |
|------|------|
| 文件完整性 | ✅ 所有 7 个 SKILL.md 存在；所有 references 引用文件均存在；报告模板齐全 |
| Schema 一致性 | ⚠️ 基本对齐，但存在个别字段定义差异和工具引用错误 |
| 逻辑正确性 | ⚠️ 整体合理，但存在 AHS 映射不清、工具名错误等关键问题 |
| 可操作性 | ⚠️ 部分 Skill 引用了不存在的工具（`TaskCreate`/`TaskOutput`），需修正为 Kimi Work 实际工具 |

**总体评价：** 框架结构完整，设计理念清晰，Schema 体系基本统一。主要问题集中在 **工具引用错误**（伪工具名）和 **个别逻辑映射不清** 两处。修复后可进入可用状态。

---

## 2. 文件完整性检查

### 2.1 SKILL.md 文件

| Skill | 状态 | 行数 | 评估 |
|-------|------|------|------|
| dare-core | ✅ | 157 | 编排中枢，内容完整 |
| dare-memory | ✅ | 185 | 双记忆架构，内容完整 |
| dare-req | ✅ | 111 | 需求阶段，内容完整 |
| dare-arch | ✅ | 120 | 架构阶段，内容完整 |
| dare-code | ✅ | 123 | 代码阶段，内容完整 |
| dare-test | ✅ | 107 | 测试阶段，内容完整 |
| dare-report | ✅ | 105 | 报告追踪，内容完整 |

### 2.2 References 文件

| Skill | 引用文件 | 实际存在 | 状态 |
|-------|----------|----------|------|
| dare-core | `request_schema.json` | ✅ | 78 行 JSON |
| dare-core | `intensity_matrix.md` | ✅ | 203 行 Markdown |
| dare-core | `orchestration_patterns.md` | ✅ | 16772 字节 |
| dare-core | `judge_scoring_guide.md` | ✅ | 10074 字节 |
| dare-core | `../dare-report/references/unified_schema.json` | ✅ | 317 行 JSON |
| dare-memory | `stm_schema.md` | ✅ | 8089 字节 |
| dare-memory | `ltm_schema.md` | ✅ | 12979 字节 |
| dare-memory | `retrieval_prompts.md` | ✅ | 11246 字节 |
| dare-req | `req_output_schema.json` | ✅ | 230 行 JSON |
| dare-req | `prompt_templates.md` | ✅ | 10770 字节 |
| dare-req | `../dare-report/references/unified_schema.json` | ✅ | 通过 |
| dare-req | `../dare-report/references/report_templates/req_report_template.md` | ✅ | 3500 字节 |
| dare-arch | `arch_output_schema.json` | ✅ | 267 行 JSON |
| dare-arch | `prompt_templates.md` | ✅ | 13947 字节 |
| dare-arch | `ahs_calculation.md` | ✅ | 5621 字节 |
| dare-arch | `anti_patterns_catalog.md` | ✅ | 11148 字节 |
| dare-arch | `../dare-report/references/unified_schema.json` | ✅ | 通过 |
| dare-arch | `../dare-report/references/report_templates/arch_report_template.md` | ✅ | 3805 字节 |
| dare-code | `code_output_schema.json` | ✅ | 244 行 JSON |
| dare-code | `prompt_templates.md` | ✅ | 16017 字节 |
| dare-code | `cwe_classification.md` | ✅ | 6745 字节 |
| dare-code | `github_action_template.md` | ✅ | 10575 字节 |
| dare-code | `gitlab_ci_template.md` | ✅ | 12755 字节 |
| dare-code | `../dare-report/references/unified_schema.json` | ✅ | 通过 |
| dare-code | `../dare-report/references/report_templates/code_report_template.md` | ✅ | 3501 字节 |
| dare-test | `test_output_schema.json` | ✅ | 326 行 JSON |
| dare-test | `prompt_templates.md` | ✅ | 19816 字节 |
| dare-test | `boundary_test_patterns.md` | ✅ | 12351 字节 |
| dare-test | `chaos_scenarios.md` | ✅ | 15867 字节 |
| dare-test | `../dare-report/references/unified_schema.json` | ✅ | 通过 |
| dare-test | `../dare-report/references/report_templates/test_report_template.md` | ✅ | 4404 字节 |
| dare-report | `unified_schema.json` | ✅ | 317 行 JSON |
| dare-report | `dashboard_metrics.md` | ✅ | 7085 字节 |
| dare-report | `report_generation_prompt.md` | ✅ | 3794 字节 |
| dare-report | `project_config_example.md` | ✅ | 6095 字节 |
| dare-report | `report_templates/` | ✅ | 4 个模板文件 |

**结论：** 全部 34 个被引用文件均存在，文件完整性 100%。

---

## 3. Schema 一致性检查

### 3.1 统一 Schema 核心要求

`dare-report/references/unified_schema.json` 定义了所有阶段必须遵循的顶层字段：

**required 字段（10个）：**
```
record_id, stage, timestamp, intensity_level, review_summary,
issues, scores, gate_result, confidence_score, escalation_triggered
```

**scores 必含（4个）：**
```
overall, security, maintainability, performance
```

**issue 必含（7个）：**
```
issue_id, dimension, severity, description, evidence, impact, recommendation
```

### 3.2 各阶段 Output Schema 对齐情况

| 检查项 | dare-req | dare-arch | dare-code | dare-test | 结论 |
|--------|----------|-----------|-----------|-----------|------|
| 10个 required 顶层字段 | ✅ | ✅ | ✅ | ✅ | 完全对齐 |
| scores 4个必含字段 | ✅ | ✅ | ✅ | ✅ | 完全对齐 |
| issue 7个必含字段 | ✅ | ✅ | ✅ | ✅ | 完全对齐 |
| issue_id pattern | `^REQ-[0-9]{3}$` | `^ARCH-[0-9]{3}$` | `^CODE-[0-9]{3}$` | `^TEST-[0-9]{3}$` | 正确前缀 |
| dimension 枚举 | 8个 | 8个 | 8个 | 8个 | 统一 |
| severity 枚举 | 4级 | 4级 | 4级 | 4级 | 统一 |
| gate_result 枚举 | 3个 | 3个 | 3个 | 3个 | 统一 |
| additionalProperties | true | true | true | true | 允许扩展 |

**Schema 结论：** 四个阶段输出 Schema 与统一 Schema **完全对齐**，仅各阶段扩展字段不同（如 `assumptions_catalog`、`alternative_proposals` 等），这符合设计意图。

### 3.3 细微差异（非错误，但值得注意）

| 差异点 | 位置 | 说明 |
|--------|------|------|
| `title` 字段 | dare-arch issue | `arch_output_schema.json` 的 issue 定义中比统一 Schema 多一个 `title` 字段（可选），不影响兼容性 |
| `remediation_effort` | dare-arch issue | 仅 ARCH 阶段有 `trivial` 到 `massive` 的修复工作量评估，合理 |
| `anti_pattern_ref` | dare-arch issue | 关联反模式目录，ARCH 特有，合理 |
| `allOf` 条件约束 | dare-code issue | 当 `dimension == "security"` 时强制要求 `category`、`attack_vector`、`line_number`、`location`。这是增强约束，非错误，但其他阶段无类似条件 |
| `review_metadata` / `summary` | dare-test | 遗留字段，用于向后兼容，不影响 |
| `reviewer_role` | dare-req | 顶层字段，REQ 特有，不影响 |

---

## 4. 问题清单（按严重程度分类）

### 🔴 严重问题（P0 — 必须修复）

#### 问题 1：引用不存在的工具（影响所有阶段）

**描述：** 多个 SKILL.md 在 "Claude Code 工具集成" 部分引用了 `TaskCreate`、`TaskOutput`、`TaskUpdate`，这些**不是 Kimi Work 的实际工具**。

**受影响位置：**
- `dare-core/SKILL.md` 第 128-135 行、第 139 行
- `dare-memory/SKILL.md` 第 169 行（`TaskUpdate`）
- `dare-req/SKILL.md` 第 91-98 行
- `dare-arch/SKILL.md` 第 98-106 行
- `dare-code/SKILL.md` 第 100-108 行
- `dare-test/SKILL.md` 第 86-93 行

**Kimi Work 实际可用工具：** `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `Agent`, `PythonRun`, `Cron`, `SkillManage` 等。

**建议修复：** 将所有 `TaskCreate`/`TaskOutput`/`TaskUpdate` 替换为 `Agent` 工具调用示例。例如：
```markdown
2. **创建审查任务**
   - 使用 `Agent` 工具分别调用各 Devil 角色：
     ```
     Agent: Devil-BA 审查需求
     Agent: Devil-UX 审查需求
     Agent: Devil-Tech 审查需求
     ```
   - 使用 `Agent` 工具调用 Judge 角色汇总结果
```

---

### 🟡 中等问题（P1 — 建议修复）

#### 问题 2：AHS 与 scores 映射逻辑不清

**位置：** `dare-arch/SKILL.md` 第 55-62 行

**描述：**
```
AHS = 0.25 * technical_selection + 0.30 * robustness + 0.25 * scalability + 0.20 * tech_debt
```

但 `scores` 中只有 `overall`, `security`, `maintainability`, `performance`, `reliability`, `scalability`，没有直接对应 `technical_selection` 和 `tech_debt` 的字段。

`arch_output_schema.json` 中说明：
- `scores.maintainability` ← 从 `technical_selection` / `tech_debt` 推导
- `scores.reliability` ← 从 `robustness` 推导
- `scores.performance` ← 从 `scalability` 推导

但 `AHS` 的加权公式中，四个原始维度如何映射到 `scores` 的五个维度，再通过 `scores` 计算 `overall`，这个逆向推导过程在 SKILL.md 中没有明确说明。

**建议：** 在 SKILL.md 中增加一段说明：
```markdown
AHS 计算完成后，映射到 scores 字段的方式：
- scores.overall = AHS
- scores.maintainability = (technical_selection * 0.25 + tech_debt * 0.20) / 0.45
- scores.reliability = robustness
- scores.performance = scalability
- scores.security = 从安全架构缺陷评估独立计算
```

#### 问题 3：dare-core 缺少 "Advocate" 角色分配说明

**位置：** `dare-core/SKILL.md` 第 69-73 行

**描述：** 角色行为规范中定义了 Devil、Advocate、Judge 三个角色，但 "分配 Agent 角色" 部分只说明了 Devil 和 Judge 的分配，没有说明 **Advocate 由谁担任**。在 `review` 模式中说"单个 Agent 兼任 Devil 和 Advocate"，但其他模式下 Advocate 是谁？

**建议：** 在 "分配 Agent 角色" 部分补充：
```markdown
- `debate`: Devil + Advocate（通常由方案作者或维护者 Agent 担任）+ Judge
- `council`: Devil 组（2-3人）+ Advocate 组（1-2人，可由不同视角维护者组成）+ Judge
- `audit`: Devil-Sec/Devil-Code + Advocate（代码作者）+ Judge
```

#### 问题 4：缺少 `.dare/records/` 目录创建说明

**位置：** `dare-report/SKILL.md` 第 45-46 行

**描述：** 报告输出到 `.dare/records/` 目录，但没有任何 Skill 说明该目录需要预先创建，也没有说明 `.dare/` 目录结构的标准布局。

**建议：** 在 dare-report 的 SKILL.md 中增加目录初始化说明：
```markdown
## 目录初始化
首次使用前，确保以下目录结构存在：
```
.dare/
├── records/          # 对抗报告存储
├── config/           # 项目级配置
└── cache/            # 临时缓存（可选）
```
```

#### 问题 5：统一 Schema 的 `trigger_type` 在 Request Schema 中缺失

**位置：** `dare-report/references/unified_schema.json` 第 25-33 行

**描述：** 统一输出 Schema 包含 `trigger_type` 和 `trigger_ref` 字段，但 `dare-core/references/request_schema.json` 中没有对应的输入字段。这意味着如果通过 CI 触发，触发类型信息无法从输入传递。

**建议：** 在 `request_schema.json` 中增加可选字段：
```json
"trigger_type": { "enum": ["pull_request", "commit", "manual", "scheduled"] },
"trigger_ref": { "type": "string" }
```

#### 问题 6：stage 间强度继承规则未在 dare-core 中体现

**位置：** `dare-core/references/intensity_matrix.md` 第 184-189 行

**描述：** 强度矩阵中定义了阶段间强度继承规则（如 `REQ Confirmed Issue → ARCH 自动至少Lv.3`），但在 `dare-core/SKILL.md` 的 "跨阶段协调" 部分没有提及此规则。

**建议：** 在 dare-core 跨阶段协调部分增加：
```markdown
3. 阶段间强度自动继承：
   - 前一阶段产生 Confirmed Issue 时，后一阶段自动提升最低强度
   - 具体规则见 `references/intensity_matrix.md` 中 "阶段间强度继承" 章节
```

---

### 🟢 轻微问题（P2 — 可选优化）

#### 问题 7：YAML 中特殊字符未引号包裹

**位置：** `dare-code/SKILL.md` 第 73 行

**描述：**
```yaml
keywords_in_diff: [password, secret, token, encrypt, hash, sudo, eval(, exec(]
```
`eval(` 和 `exec(` 包含括号，在 YAML 中虽然可以解析，但不够规范。建议加引号：
```yaml
keywords_in_diff: [password, secret, token, encrypt, hash, sudo, "eval(", "exec("]
```

#### 问题 8：dare-req 的 scores 可选字段描述不完整

**位置：** `dare-req/SKILL.md` 第 78 行

**描述：** `scores: { overall, security, maintainability, performance, reliability?, scalability? }` 中标注了 `reliability?` 和 `scalability?` 为可选，但在 `req_output_schema.json` 的 `scores` 定义中并没有这两个字段。虽然 `additionalProperties: true` 允许它们存在，但不在 Schema 中显式定义会导致验证工具报错。

**建议：** 在 `req_output_schema.json` 的 `scores` 定义中补充 `reliability` 和 `scalability` 作为可选字段（已有 `correctness` 和 `usability`，统一风格即可）。

#### 问题 9：缺少框架总览索引文件

**描述：** 7 个 Skill 分散在不同目录，没有一份 `README.md` 或 `INDEX.md` 帮助用户快速了解整个框架的结构、Skill 之间的关系、以及使用顺序。

**建议：** 在工作目录根目录创建 `DARE-Skills/README.md`，包含：
- 框架概述
- 7 个 Skill 的关系图
- 快速开始指南
- 典型使用场景示例

#### 问题 10：对抗收益比计算缺乏可操作性

**位置：** `dare-report/SKILL.md` 第 68 行

**描述：** "对抗收益比 = 预估避免损失 / 执行耗时"，但没有说明如何计算"预估避免损失"。

**建议：** 在 `dare-report/references/dashboard_metrics.md` 中补充收益估算方法：
```markdown
预估避免损失计算：
- Critical 问题：按平均生产事故成本估算（可配置默认值）
- High 问题：按平均修复延迟成本估算
- Medium/Low 问题：按技术债务累积成本估算
```

#### 问题 11：部分路径依赖硬编码的目录结构

**描述：** 多个 SKILL.md 使用 `../dare-report/references/unified_schema.json` 等相对路径引用其他 Skill 的文件。这假设了所有 Skill 始终安装在同一个父目录下且保持固定目录名。在 Skill 系统独立管理时，这种路径可能失效。

**建议：** 在 README 中说明 "安装时必须保持以下目录结构"，或考虑将统一 Schema 复制到各阶段目录中作为冗余（但会增加维护成本）。当前方案作为最佳实践文档化即可。

---

## 5. 优化建议（按优先级排序）

### 高优先级

| 编号 | 建议 | 理由 | 预估工作量 |
|------|------|------|------------|
| 1 | 将所有 `TaskCreate`/`TaskOutput`/`TaskUpdate` 替换为 `Agent` 工具说明 | 当前引用的是不存在的工具，直接导致 Skill 不可执行 | 小（文本替换） |
| 2 | 补充 `dare-core` 中 Advocate 角色分配说明 | 角色定义完整但分配缺失，导致流程无法执行 | 小 |
| 3 | 补充 `.dare/records/` 目录初始化说明 | 报告输出依赖此目录，但无创建说明 | 小 |
| 4 | 在 `request_schema.json` 中增加 `trigger_type`/`trigger_ref` | 与统一输出 Schema 对齐 | 小 |

### 中优先级

| 编号 | 建议 | 理由 | 预估工作量 |
|------|------|------|------------|
| 5 | 明确 AHS → scores 的映射公式 | 当前映射关系存在歧义 | 小 |
| 6 | 在 `dare-core` 跨阶段协调中引用强度继承规则 | 规则存在于 intensity_matrix 但不在核心 Skill 中体现 | 小 |
| 7 | 统一各阶段 `prompt_templates.md` 的 Lv.1-Lv.5 前缀模板 | 虽然各阶段有独立模板，但 `intensity_matrix.md` 中已定义通用模板，可检查是否重复或冲突 | 中 |
| 8 | 创建根目录 `README.md` | 降低用户上手成本，展示框架全貌 | 中 |
| 9 | 补充收益比计算的可操作方法 | 当前指标缺乏可操作性 | 小 |

### 低优先级

| 编号 | 建议 | 理由 | 预估工作量 |
|------|------|------|------------|
| 10 | 修复 YAML 中 `eval(`/`exec(` 的引号 | 格式规范 | 极小 |
| 11 | 在 `req_output_schema.json` 的 scores 中补充 `reliability`/`scalability` | 可选字段一致性 | 极小 |
| 12 | 增加错误处理和超时说明 | 当前缺少 Agent 失败时的回退策略 | 中 |
| 13 | 增加典型使用场景的端到端示例 | 帮助用户理解跨 Skill 协作流程 | 中 |
| 14 | 为各阶段增加 "最小输入要求" 检查清单 | 类似 dare-arch 已有审查输入要求，其他阶段可借鉴 | 小 |

---

## 6. 跨 Skill 引用关系图

```
                            ┌─────────────────┐
                            │   dare-core     │
                            │  (编排中枢)     │
                            └────────┬────────┘
                                     │
           ┌─────────┬─────────┬─────┴─────┬─────────┬─────────┐
           │         │         │           │         │         │
           ▼         ▼         ▼           ▼         ▼         ▼
    ┌─────────┐ ┌─────────┐ ┌─────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │dare-req │ │dare-arch│ │dare-│ │dare-code│ │dare-test│ │dare-    │
    │         │ │         │ │code │ │         │ │         │ │report   │
    └────┬────┘ └────┬────┘ └─────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │                    │           │           │
         └───────────┴────────────────────┴───────────┴───────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ dare-memory     │
                            │ (记忆注入/检索)  │
                            └─────────────────┘

依赖关系：
- 所有阶段 → dare-core (模式选择、强度配置)
- 所有阶段 → dare-report (统一输出、报告生成)
- 所有阶段 → dare-memory (历史记忆注入)
- dare-core → dare-report (统一 Schema 读取)
```

---

## 7. 附录：各阶段扩展字段汇总

| 阶段 | 特有扩展字段 | 用途 |
|------|-------------|------|
| REQ | `assumptions_catalog` | 隐性假设完整目录 |
| ARCH | `architecture_health_score`, `dimension_scores`, `alternative_proposals`, `overall_verdict` | AHS 评分、替代方案、综合裁决 |
| CODE | `file_path`, `blocker_count`, `debate_context` | 文件路径、阻塞计数、辩论上下文 |
| TEST | `review_metadata`, `test_coverage_assessment`, `missing_test_cases`, `coverage_gaps`, `recommended_coverage_target`, `summary` | 测试覆盖评估、缺失用例、覆盖缺口 |
| Report | — | 作为统一汇总端，接收所有阶段输入 |

**评价：** 各阶段扩展字段设计合理，均与阶段特性紧密相关，且通过 `additionalProperties: true` 保证了兼容性。

---

## 8. 结论与下一步行动

**当前状态：** 框架已具备可用基础，Schema 体系统一，文件完整，设计理念清晰。

**必须完成的修复（共 4 项）：**
1. 修复所有 `TaskCreate`/`TaskOutput`/`TaskUpdate` 为 `Agent` 工具
2. 补充 dare-core 中 Advocate 角色分配
3. 补充 `.dare/records/` 目录初始化说明
4. 在 request_schema.json 中补充 trigger 字段

**建议完成的优化（共 10 项）：**
- 见第 5 节优化建议表

**修复后即可进入测试阶段。**
