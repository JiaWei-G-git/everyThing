---
name: dare-memory
description: >
  D.A.R.E.框架记忆管理模块。管理短期记忆（STM，单会话内共享）和长期记忆（LTM，跨会话持久化），
  包含假设库、问题模式和决策历史。在对抗会话启动时自动检索相关历史记录注入Prompt上下文。
  触发场景：(1) 新对抗审查会话启动；(2) 发现隐性假设或问题模式；(3) 会话结束持久化；(4) 跨会话趋势分析。
---

# D.A.R.E. Memory — 对抗框架记忆管理模块

## 概述

管理对抗性审查过程中的双记忆架构（STM + LTM），实现跨会话经验继承与上下文注入。在 D.A.R.E. 的 REQ/ARCH/CODE/TEST 四个阶段中负责记忆的存储、检索、注入和持久化。

**核心职责：**
- 维护单会话内的短期记忆（辩论记录、当前状态）
- 持久化跨会话的长期记忆（假设库、问题模式、决策历史）
- 会话启动时自动检索相关历史并注入各 Agent 的 System Prompt
- 会话结束时将关键结论从 STM 异步迁移至 LTM

## 双记忆架构

### 短期记忆（STM）

单次对抗会话内共享的临时存储，会话结束时清空，关键结论提取到 LTM。

```yaml
stm:
  session_id: "uuid"
  stage: "REQ | ARCH | CODE | TEST"
  target_artifact: "string"
  messages: [{ round, speaker, content, message_type, timestamp }]
  current_status:
    phase: "opening | debate | rebuttal | synthesis | closed"
    active_assumptions: ["assumption_id[]"]
    consensus_points: ["string[]"]
    pending_challenges: ["string[]"]
    round_count: "integer"
```

### 长期记忆（LTM）

跨会话持久化，存储在向量数据库中，包含三类核心数据：

| 类型 | 用途 | 关键字段 |
|------|------|----------|
| 假设库 | 隐性假设及验证状态 | assumption_id, content, stage, risk_level, validation_status |
| 问题模式 | 重复出现的问题类型 | pattern_id, pattern_name, occurrence_count, affected_stages |
| 决策历史 | 关键架构决策的对抗结论 | decision_id, decision_summary, dare_conclusion, ahs_score |

完整 Schema 和索引设计见 `references/stm_schema.md` 和 `references/ltm_schema.md`。

## 记忆检索与注入流程

### Step 1: 提取工件特征

从当前工件提取技术栈关键词、业务领域、文件名模式、阶段、项目和团队标识。

### Step 2: 向量相似度检索

```python
retrieval_params = {
    "query_embedding": embed(technology_tags + [business_domain]),
    "filters": { "stage": current_stage, "project": artifact_features.project },
    "top_k": 5,
    "min_similarity": 0.75,
    "memory_types": ["assumption", "pattern", "decision"]
}
```

### Step 3: 格式化并注入上下文

将检索结果格式化为上下文块，注入各 Agent 的 System Prompt：

```markdown
## 历史记忆（自动注入）

### 相关假设（{{count}}条）
{{#each assumptions}}
- [{{risk_level}}] {{content}}（来源：{{stage}}阶段，{{discovered_at}}）
  验证状态：{{validation_status}}
{{/each}}

### 常见问题模式（{{count}}条）
{{#each patterns}}
- {{pattern_name}}：{{description}}（已出现{{occurrence_count}}次）
{{/each}}

### 相关决策历史
{{#each decisions}}
- {{decision_summary}}
  对抗结论：{{dare_conclusion}}
  评分：{{ahs_score}}
{{/each}}
```

### Step 4: 实时更新 STM

| 事件 | 动作 |
|------|------|
| Devil 识别新假设 | 创建 assumption 记录，写入 active_assumptions |
| 达成共识 | 更新 validation_status，移入 consensus_points |
| 新挑战出现 | 写入 pending_challenges |
| 发现模式 | 关联现有 pattern 或标记新 pattern 候选 |

### Step 5: 异步迁移到 LTM

| 来源 | 目标 | 条件 |
|------|------|------|
| verified assumptions | LTM 假设库 | validation_status in [verified, falsified] |
| recurring patterns | LTM 问题模式 | occurrence_count > 1 或 pattern_candidate |
| consensus decisions | LTM 决策历史 | ahs_score is not null |
| unresolved challenges | LTM 假设库 (deferred) | 会话关闭时仍 pending |

## 向量存储配置

```json
{
  "memory_id": "mem_{type}_{uuid8}",
  "memory_type": "assumption | pattern | decision",
  "stage": "REQ | ARCH | CODE | TEST",
  "content": "string",
  "embedding": "float[384]",
  "metadata": { "project", "team", "technology_tags", "business_domain", "severity", "created_at" },
  "relations": ["memory_id[]"],
  "version": "integer"
}
```

| 参数 | 值 |
|------|------|
| collection_name | `dare_ltm` |
| embedding_dim | 384（all-MiniLM-L6-v2） |
| distance_metric | cosine |
| index_type | HNSW |

## 检索场景

| 场景 | 触发条件 | 检索目标 |
|------|----------|----------|
| 会话预热 | 新会话启动 | 与当前工件最相关的 top-5 记忆 |
| 轮间继承 | 阶段切换 | 前一阶段的关键假设和决策 |
| 实时关联 | 发现新假设/问题 | 相似历史假设和相关模式 |
| 趋势分析 | 会话结束/定期报告 | 跨会话的假设验证率和模式频率 |
| 决策溯源 | 评估历史决策效果 | 特定决策的完整上下文和后续追踪 |

各检索场景的详细 Prompt 模板和参数配置见 `references/retrieval_prompts.md`。

## 命令参考

| 命令 | 用途 | 示例 |
|------|------|------|
| `memory.store_assumption` | 存储新假设到 STM | 发现隐性假设时调用 |
| `memory.store_pattern` | 记录问题模式 | 识别到重复问题时调用 |
| `memory.store_decision` | 记录决策结论 | 达成共识时调用 |
| `memory.retrieve_relevant` | 检索相关历史记忆 | 会话启动、轮次切换时调用 |
| `memory.migrate_to_ltm` | STM → LTM 迁移 | 会话结束时调用 |
| `memory.update_validation` | 更新假设验证状态 | 假设被证实/证伪时调用 |
| `memory.get_trends` | 获取跨会话趋势 | 生成报告时调用 |

## Claude Code 工具集成

1. **会话启动时加载历史记忆**
   - `Read` 读取 `references/retrieval_prompts.md`
   - `Grep` 在 `.dare/records/` 中搜索与当前工件相关的历史记录
   - 或使用外部向量数据库检索 top-k 相关记忆

2. **实时更新短期记忆**
   - Devil 识别新假设时：`Write` 或 `Edit` 更新 STM 记录
   - 达成共识或新挑战出现时：`TaskUpdate` 更新当前任务状态

3. **会话结束迁移到长期记忆**
   - `Read` 读取当前 STM
   - 将 verified assumptions、recurring patterns、consensus decisions 写入 LTM
   - 生成向量嵌入并存储到向量数据库

4. **趋势分析**
   - `Glob` 收集 `.dare/records/*.json`
   - `Bash` 运行脚本统计假设验证率、模式频率、决策效果

## 参考资料

- `references/stm_schema.md` — 短期记忆完整 Schema 和生命周期管理
- `references/ltm_schema.md` — 长期记忆完整 Schema、向量索引设计和迁移策略
- `references/retrieval_prompts.md` — 各检索场景的 Prompt 模板和参数配置
