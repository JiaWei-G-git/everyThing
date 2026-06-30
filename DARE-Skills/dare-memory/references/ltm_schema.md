# Long-Term Memory (LTM) Schema & Index Design

长期记忆（LTM）是跨会话持久化的记忆存储，基于向量数据库实现语义检索。包含假设库、问题模式和决策历史三类数据，支持相似度检索、关联遍历和趋势分析。

## Entity Schemas

### 1. Assumption Library

```typescript
interface Assumption {
  // 主键
  assumption_id: string;        // 格式: asm_{uuid8}
  
  // 核心内容
  content: string;              // 假设描述（自然语言）
  stage: Stage;                 // 发现阶段
  source_artifact: string;      // 发现该假设的工件标识
  
  // 风险评估
  risk_level: "critical" | "high" | "medium" | "low";
  risk_rationale: string;       // 风险评级理由
  
  // 验证生命周期
  validation_status: "unverified" | "verified" | "falsified" | "deprecated";
  validation_method: string | null;   // 验证方法（如 "code_review", "test_execution"）
  validation_evidence: string | null; // 验证证据摘要
  
  // 时间戳
  discovered_at: string;        // ISO8601 发现时间
  resolved_at: string | null;   // ISO8601 解决时间（未解决为 null）
  
  // 溯源
  discovered_session: string;   // 发现会话ID
  discovered_by: string;        // 发现者角色（agent ID）
  
  // 关联
  related_patterns: string[];   // 关联的问题模式ID（pat_*）
  related_decisions: string[];  // 关联的决策ID（dcn_*）
  related_assumptions: string[];// 关联的其他假设ID
  
  // 向量检索
  embedding_text: string;       // 用于向量化的标准化文本
  // 格式: "[假设] {content} | [阶段] {stage} | [工件] {source_artifact} | [风险] {risk_level}"
}
```

**embedding_text 生成模板：**

```handlebars
[假设] {{content}}
[阶段] {{stage}}
[工件] {{source_artifact}}
[风险] {{risk_level}}
{{#if validation_status}}
[验证] {{validation_status}}
{{#if validation_evidence}}
[证据] {{validation_evidence}}
{{/if}}
{{/if}}
{{#each related_patterns}}
[模式] {{this}}
{{/each}}
```

### 2. Problem Patterns

```typescript
interface ProblemPattern {
  // 主键
  pattern_id: string;           // 格式: pat_{uuid8}
  
  // 核心内容
  pattern_name: string;         // 模式名称（简短可读）
  description: string;          // 模式描述（详细说明）
  pattern_signature: string;    // 模式签名（结构化表示，用于匹配）
  
  // 统计
  first_seen: string;           // ISO8601 首次出现
  last_seen: string;            // ISO8601 最近出现
  occurrence_count: number;     // 出现次数
  affected_sessions: string[];  // 受影响的会话ID列表
  
  // 影响范围
  affected_stages: Stage[];     // 影响哪些阶段
  typical_severity: "critical" | "high" | "medium" | "low";
  
  // 示例
  example_assumptions: string[];// 典型假设ID列表（asm_*）
  example_artifacts: string[];  // 典型工件标识列表
  
  // 趋势
  frequency_trend: "increasing" | "stable" | "decreasing" | "sporadic";
  
  // 向量检索
  embedding_text: string;
  // 格式: "[模式] {pattern_name}: {description} | [阶段] {affected_stages} | [严重度] {typical_severity}"
}
```

**embedding_text 生成模板：**

```handlebars
[模式] {{pattern_name}}: {{description}}
[阶段] {{affected_stages.join(", ")}}
[严重度] {{typical_severity}}
[频率] 出现{{occurrence_count}}次
[趋势] {{frequency_trend}}
{{#each example_artifacts}}
[工件] {{this}}
{{/each}}
```

### 3. Decision History

```typescript
interface DecisionHistory {
  // 主键
  decision_id: string;          // 格式: dcn_{uuid8}
  
  // 决策上下文
  stage: Stage;                 // 决策阶段
  decision_summary: string;     // 决策摘要（一句话）
  context: string;              // 决策上下文描述
  
  // 对抗结论
  dare_conclusion: string;      // 对抗得出的结论
  consensus_method: string;     // 共识达成方式
  dissenting_views: string[];   // 反对意见（如有）
  
  // 评估
  ahs_score: number;            // 0.0-1.0，对抗健康评分
  ahs_breakdown: {              // AHS 分项评分
    assumption_coverage: number;    // 假设覆盖度
    devil_advocacy: number;         // 魔鬼代言强度
    evidence_quality: number;       // 证据质量
    consensus_clarity: number;      // 共识清晰度
  };
  
  // 后续追踪
  followup_status: "pending" | "implemented" | "verified" | "overridden";
  effectiveness_rating: "high" | "medium" | "low" | "unknown";
  followup_notes: string | null;
  
  // 时间戳
  decided_at: string;           // ISO8601 决策时间
  reviewed_at: string | null;   // ISO8601 回顾时间
  
  // 关联
  related_assumptions: string[];// 关联假设ID列表（asm_*）
  related_patterns: string[];   // 关联模式ID列表（pat_*）
  decided_in_session: string;   // 决策所在会话ID
  
  // 向量检索
  embedding_text: string;
  // 格式: "[决策] {decision_summary} | [结论] {dare_conclusion} | [阶段] {stage} | [评分] {ahs_score}"
}
```

**embedding_text 生成模板：**

```handlebars
[决策] {{decision_summary}}
[结论] {{dare_conclusion}}
[阶段] {{stage}}
[上下文] {{context}}
[评分] AHS={{ahs_score}}
{{#each related_assumptions}}
[假设] {{this}}
{{/each}}
{{#if effectiveness_rating}}
[效果] {{effectiveness_rating}}
{{/if}}
```

## Unified Vector Store Record

所有 LTM 数据统一存储为向量记录：

```typescript
interface VectorStoreRecord {
  // 主键
  memory_id: string;            // 格式: mem_{type}_{uuid8}
                                // type: asm (assumption) | pat (pattern) | dcn (decision)
  
  // 类型标识
  memory_type: "assumption" | "pattern" | "decision";
  stage: Stage;
  
  // 可检索内容
  content: string;              // 向量化文本（对应各实体的 embedding_text）
  embedding: number[];          // float[384]，向量表示
  
  // 元数据（用于过滤和排序）
  metadata: {
    // 项目/团队
    project: string;            // 项目标识
    team: string;               // 团队标识
    
    // 领域标签
    technology_tags: string[];  // 技术栈标签
    business_domain: string;    // 业务领域标签
    
    // 严重度
    severity: "critical" | "high" | "medium" | "low";
    
    // 时间
    created_at: string;         // ISO8601 创建时间
    last_accessed_at: string;   // ISO8601 最后访问时间
    
    // 统计
    access_count: number;       // 被检索次数
    
    // 关联记忆（用于图遍历）
    relations: string[];        // 关联的 memory_id 列表
  };
  
  // 乐观锁
  version: number;              // 版本号，用于并发控制
}
```

## Index Design

### Vector Index (Primary)

| 参数 | 值 |
|------|------|
| Index Type | HNSW (Hierarchical Navigable Small World) |
| Distance Metric | Cosine |
| Embedding Dimension | 384 |
| ef_construction | 200 |
| M | 16 |
| ef_search | 128 |

### Filterable Metadata Indexes

| 字段 | 索引类型 | 用途 |
|------|----------|------|
| `memory_type` | Exact Match | 按类型过滤 |
| `stage` | Exact Match | 按阶段过滤 |
| `metadata.project` | Exact Match | 按项目过滤 |
| `metadata.team` | Exact Match | 按团队过滤 |
| `metadata.severity` | Exact Match | 按严重度过滤 |
| `metadata.technology_tags` | Array Contains | 按技术栈过滤 |
| `metadata.business_domain` | Exact Match | 按业务领域过滤 |
| `metadata.created_at` | Range | 时间范围查询 |
| `metadata.last_accessed_at` | Range | 近期活动查询 |
| `metadata.access_count` | Range | 热度排序 |

### Secondary Indexes (for non-vector queries)

#### Assumption ID Lookup
```
Index: assumption_id_unique
Type: Unique Hash
Field: assumption_id
```

#### Pattern Name Search
```
Index: pattern_name_fulltext
Type: Full-text (inverted index)
Field: pattern_name, description
```

#### Decision Time Range
```
Index: decided_at_range
Type: B-tree range
Field: decided_at
```

## Retrieval API

### Semantic Search

```typescript
interface SemanticSearchRequest {
  query_embedding: number[];    // 查询向量
  filters?: {
    memory_type?: ("assumption" | "pattern" | "decision")[];
    stage?: Stage[];
    project?: string;
    team?: string;
    severity?: ("critical" | "high" | "medium" | "low")[];
    technology_tags?: string[];  // 至少匹配一个
    business_domain?: string;
    created_after?: string;      // ISO8601
    created_before?: string;     // ISO8601
  };
  top_k: number;                // 返回数量，默认 5
  min_similarity?: number;      // 最小相似度阈值，默认 0.75
  include_relations?: boolean;  // 是否包含关联记忆
}

interface SemanticSearchResponse {
  results: {
    memory_id: string;
    memory_type: string;
    content: string;
    similarity: number;         // 0.0-1.0 相似度分数
    metadata: VectorStoreRecord["metadata"];
    related_memories?: VectorStoreRecord[];  // 关联记忆（如 include_relations=true）
  }[];
  total_hits: number;
  query_time_ms: number;
}
```

### Graph Traversal

通过关联记忆进行图遍历，发现间接关联：

```typescript
interface GraphTraversalRequest {
  start_memory_id: string;      // 起始记忆ID
  relation_depth: number;       // 遍历深度，默认 2
  max_nodes: number;            // 最大节点数，默认 20
  filters?: {
    memory_type?: ("assumption" | "pattern" | "decision")[];
    stage?: Stage[];
  };
}

interface GraphTraversalResponse {
  nodes: {
    memory_id: string;
    memory_type: string;
    content: string;
    depth: number;              // 距起点的深度
  }[];
  edges: {
    source: string;
    target: string;
    relation_type: string;      // 关联类型（如 "related", "derived", "contradicts"）
  }[];
}
```

### Trend Query

用于跨会话趋势分析：

```typescript
interface TrendQueryRequest {
  project?: string;
  team?: string;
  stage?: Stage;
  time_range: {
    from: string;               // ISO8601
    to: string;                 // ISO8601
  };
  group_by: "day" | "week" | "month";
  metrics: ("assumption_count" | "pattern_frequency" | "avg_ahs" | "severity_distribution")[];
}

interface TrendQueryResponse {
  time_series: {
    period: string;             // 时间段标识
    assumption_count: number;
    verified_count: number;
    falsified_count: number;
    new_patterns: number;
    avg_ahs_score: number;
    severity_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  }[];
  summary: {
    total_assumptions: number;
    total_patterns: number;
    overall_avg_ahs: number;
    top_patterns: { pattern_id: string; pattern_name: string; count: number }[];
  };
}
```

## Migration Strategy

### STM → LTM Write Pipeline

```yaml
pipeline:
  step_1_validate:
    description: "验证待迁移数据"
    checks:
      - "assumption.validation_status 必须为 verified/falsified/deprecated 之一"
      - "decision.ahs_score 必须在 0.0-1.0 范围内"
      - "pattern.occurrence_count 必须 >= 1"
  
  step_2_dedup:
    description: "去重检查"
    method: "向量相似度去重"
    threshold: 0.92
    action_on_dup: "更新已有记录（保留最早 discovered_at，合并 source_artifact，累加 occurrence_count）"
  
  step_3_embed:
    description: "生成向量嵌入"
    model: "all-MiniLM-L6-v2"
    batch_size: 32
    
  step_4_upsert:
    description: "写入向量数据库"
    conflict_resolution: "memory_id 冲突时按 version 乐观锁处理"
    
  step_5_index:
    description: "更新辅助索引"
    async: true  # 异步更新全文索引和 B-tree 索引
  
  step_6_notify:
    description: "通知关联系统"
    events:
      - "memory_stored"
      - "pattern_updated"
      - "assumption_validated"
```

### Conflict Resolution

```yaml
conflict_rules:
  assumption_content_similarity:
    threshold: 0.92
    resolution: "merge"
    merge_strategy:
      content: "保留更详细的描述"
      risk_level: "取较高风险等级"
      source_artifact: "合并 artifact 列表"
      validation_status: "按优先级: verified > falsified > unverified"
  
  pattern_name_duplicate:
    resolution: "update"
    update_fields:
      - occurrence_count: "+= 1"
      - last_seen: "更新为当前时间"
      - affected_sessions: "追加新会话ID"
  
  decision_id_collision:
    resolution: "reject"
    action: "生成新 ID 并重试"
```

## Data Retention

```yaml
retention:
  active_records:
    keep_forever: true           # 活动记录永久保留
    archive_after: "2 years"     # 2年后迁移到冷存储
  
  deprecated_records:
    retain_for: "1 year"         # deprecated 记录保留1年
    purge_after: "1 year"
  
  archive:
    format: "parquet"
    location: "storage://dare-ltm-archive/{year}/{quarter}/"
    compression: "zstd"
    searchable: true             # 归档数据仍可通过批量查询检索
```
