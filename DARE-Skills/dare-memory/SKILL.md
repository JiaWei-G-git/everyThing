---
name: dare-memory
description: >
  D.A.R.E.框架记忆管理模块。管理短期记忆（STM，单会话内共享）和长期记忆（LTM，跨会话持久化），
  包含假设库、问题模式和决策历史。在对抗会话启动时自动检索相关历史记录注入Prompt上下文。
  当需要跨阶段追踪隐性假设、继承历史对抗经验、或进行趋势分析时触发。
  触发场景：(1) 新的对抗审查会话启动，需要加载历史记忆时；
  (2) 审查过程中发现新的隐性假设或问题模式，需要实时存储时；
  (3) 会话结束，需要将关键结论持久化到长期记忆时；
  (4) 进行跨会话趋势分析或假设验证追踪时。
---

# D.A.R.E. Memory — 对抗框架记忆管理模块

## Overview

管理对抗性审查过程中的双记忆架构（短期记忆 STM + 长期记忆 LTM），实现跨会话的经验继承与上下文注入。在 D.A.R.E. 框架的四个阶段（REQ/ARCH/CODE/TEST）中，负责记忆的存储、检索、注入和持久化。

**核心职责：**
- 维护单会话内的短期记忆（辩论记录、当前状态）
- 持久化跨会话的长期记忆（假设库、问题模式、决策历史）
- 会话启动时自动检索相关历史并注入各 Agent 的 System Prompt
- 会话结束时将关键结论从 STM 异步迁移至 LTM

## Dual-Memory Architecture

### Short-Term Memory (STM)

单次对抗会话内共享的临时存储，会话结束时清空，关键结论提取到 LTM。

```yaml
stm:
  session_id: "uuid, 唯一会话标识"
  stage: "enum: REQ | ARCH | CODE | TEST, 当前阶段"
  target_artifact: "string, 审查目标工件标识"
  messages:
    - round: "integer, 辩论轮次"
      speaker: "enum: devil | architect | reviewer | facilitator, 发言角色"
      role_alias: "string, 角色别名"
      content: "string, 发言内容"
      message_type: "enum: argument | evidence | challenge | consensus | question"
      timestamp: "datetime, ISO8601"
      referenced_assumptions: ["assumption_id[]"]
  current_status:
    phase: "enum: opening | debate | rebuttal | synthesis | closed"
    active_assumptions: ["assumption_id[]"]
    consensus_points: ["string[]"]
    pending_challenges: ["string[]"]
    round_count: "integer"
    start_time: "datetime"
    last_activity: "datetime"
```

### Long-Term Memory (LTM)

跨会话持久化，存储在向量数据库中。包含三类核心数据：

#### 1. Assumption Library

各阶段发现的隐性假设及其验证状态。

```yaml
assumption:
  assumption_id: "string, unique"
  content: "string, 假设描述"
  stage: "enum: REQ | ARCH | CODE | TEST"
  source_artifact: "string, 发现该假设的工件"
  risk_level: "enum: critical | high | medium | low"
  validation_status: "enum: unverified | verified | falsified | deprecated"
  discovered_at: "datetime"
  resolved_at: "datetime | null"
  discovered_session: "string, 发现会话ID"
  related_patterns: ["pattern_id[]"]
  embedding_text: "string, 用于向量化的文本表示"
```

#### 2. Problem Patterns

重复出现的问题类型，用于趋势分析和预警。

```yaml
pattern:
  pattern_id: "string, unique"
  pattern_name: "string, 模式名称"
  description: "string, 模式描述"
  first_seen: "datetime"
  last_seen: "datetime"
  occurrence_count: "integer"
  affected_stages: ["enum: REQ | ARCH | CODE | TEST"]
  typical_severity: "enum: critical | high | medium | low"
  example_assumptions: ["assumption_id[]"]
  embedding_text: "string, 用于向量化的文本表示"
```

#### 3. Decision History

关键架构决策的对抗结论和后续效果追踪。

```yaml
decision:
  decision_id: "string, unique"
  stage: "enum: REQ | ARCH | CODE | TEST"
  decision_summary: "string, 决策摘要"
  context: "string, 决策上下文描述"
  dare_conclusion: "string, 对抗得出的结论"
  ahs_score: "float, 0.0-1.0, 对抗健康评分"
  dissenting_views: ["string[]"]
  followup_status: "enum: pending | implemented | verified | overridden"
  effectiveness_rating: "enum: high | medium | low | unknown"
  decided_at: "datetime"
  reviewed_at: "datetime | null"
  related_assumptions: ["assumption_id[]"]
  embedding_text: "string, 用于向量化的文本表示"
```

> **完整 Schema 和索引设计** 详见 references/stm_schema.md 和 references/ltm_schema.md。

## Memory Retrieval & Injection Flow

### Step 1: Extract Key Features

新对抗会话启动时，从当前工件提取特征：

```yaml
artifact_features:
  technology_tags: ["string[]", "技术栈关键词"]
  business_domain: "string, 业务领域标签"
  file_patterns: ["string[]", "文件名模式"]
  stage: "enum: REQ | ARCH | CODE | TEST"
  project: "string, 项目标识"
  team: "string, 团队标识"
```

提取规则：
- **技术栈关键词**：从文件扩展名、import 语句、配置文件提取（如 `react`, `kubernetes`, `postgresql`）
- **业务领域标签**：从目录结构、README、API 路径提取（如 `payment`, `user-management`, `inventory`）
- **文件名模式**：通配符模式（如 `*service*.py`, `*controller*.java`）

### Step 2: Vector Similarity Search

向向量数据库发起相似度检索：

```python
retrieval_params = {
    "query_embedding": embed(artifact_features.technology_tags + [artifact_features.business_domain]),
    "filters": {
        "stage": current_stage,
        "project": artifact_features.project,
    },
    "top_k": 5,
    "min_similarity": 0.75,
    "memory_types": ["assumption", "pattern", "decision"]
}
```

### Step 3: Format & Inject Context

将检索结果格式化为上下文块，注入各 Agent 的 System Prompt。

**注入模板：**

```markdown
## 历史记忆（自动注入）
以下是从历史对抗审查中发现的相关记录，供你参考：

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

---
**提示**：以上记录仅供参考，当前审查应基于具体上下文独立判断。如发现历史记录与当前情况不符，优先以当前分析为准。
```

### Step 4: Real-time STM Updates

对抗过程中，新发现的假设和问题实时写入 STM：

```yaml
realtime_update_triggers:
  - event: "devil_identifies_assumption"
    action: "创建 assumption 记录，写入 STM.current_status.active_assumptions"
  - event: "consensus_reached"
    action: "更新 assumption.validation_status，移入 consensus_points"
  - event: "new_challenge_raised"
    action: "写入 STM.current_status.pending_challenges"
  - event: "pattern_detected"
    action: "关联现有 pattern 或标记新 pattern 候选"
```

### Step 5: Async LTM Persistence

会话结束时，STM 中的关键结论异步写入 LTM：

```yaml
migration_rules:
  - source: "verified assumptions"
    destination: "LTM assumption library"
    condition: "validation_status in [verified, falsified]"
  - source: "recurring patterns"
    destination: "LTM problem patterns"
    condition: "occurrence_count > 1 or marked as pattern_candidate"
  - source: "consensus decisions"
    destination: "LTM decision history"
    condition: "ahs_score is not null"
  - source: "unresolved challenges"
    destination: "LTM assumption library (deferred)"
    condition: "pending at session close"
```

迁移时生成向量嵌入，写入向量数据库。

## Vector Store Schema

```json
{
  "memory_id": "string, unique, 格式: mem_{type}_{uuid8}",
  "memory_type": "enum: assumption | pattern | decision",
  "stage": "enum: REQ | ARCH | CODE | TEST",
  "content": "string, 向量化文本，用于语义检索",
  "embedding": "float[], 384维向量表示 (all-MiniLM-L6-v2)",
  "metadata": {
    "project": "string, 项目标识",
    "team": "string, 团队标识",
    "technology_tags": ["string[]"],
    "business_domain": "string, 业务领域",
    "severity": "enum: critical | high | medium | low",
    "created_at": "datetime, ISO8601",
    "last_accessed_at": "datetime, ISO8601",
    "access_count": "integer, 访问计数"
  },
  "relations": ["memory_id[], 关联记忆ID，用于图遍历"],
  "version": "integer, 乐观锁版本号"
}
```

### Collection 配置

| 参数 | 值 | 说明 |
|------|------|------|
| `collection_name` | `dare_ltm` | LTM 主集合 |
| `embedding_dim` | 384 | all-MiniLM-L6-v2 输出维度 |
| `distance_metric` | `cosine` | 余弦相似度 |
| `index_type` | `HNSW` | 近似最近邻 |
| `ef_construction` | 200 | HNSW 构建参数 |
| `M` | 16 | HNSW 图度参数 |

## Retrieval Scenarios

各检索场景的详细 Prompt 模板和参数配置见 `references/retrieval_prompts.md`。

核心场景：

| 场景 | 触发条件 | 检索目标 |
|------|----------|----------|
| 会话预热 | 新会话启动 | 与当前工件最相关的 top-5 记忆 |
| 轮间继承 | 阶段切换（如 ARCH → CODE） | 前一阶段的关键假设和决策 |
| 实时关联 | 发现新假设/问题时 | 相似历史假设和相关模式 |
| 趋势分析 | 会话结束/定期报告 | 跨会话的假设验证率和模式频率 |
| 决策溯源 | 评估历史决策效果 | 特定决策的完整上下文和后续追踪 |

## Command Reference

| 命令 | 用途 | 示例 |
|------|------|------|
| `memory.store_assumption` | 存储新假设到 STM | 发现隐性假设时调用 |
| `memory.store_pattern` | 记录问题模式 | 识别到重复问题时调用 |
| `memory.store_decision` | 记录决策结论 | 达成共识时调用 |
| `memory.retrieve_relevant` | 检索相关历史记忆 | 会话启动、轮次切换时调用 |
| `memory.migrate_to_ltm` | STM → LTM 迁移 | 会话结束时调用 |
| `memory.update_validation` | 更新假设验证状态 | 假设被证实/证伪时调用 |
| `memory.get_trends` | 获取跨会话趋势 | 生成报告时调用 |

## References

- `/references/stm_schema.md` — 短期记忆完整 Schema 和生命周期管理
- `/references/ltm_schema.md` — 长期记忆完整 Schema、向量索引设计和迁移策略
- `/references/retrieval_prompts.md` — 各检索场景的 Prompt 模板和参数配置
