# Retrieval Prompts

各检索场景的 Prompt 模板和参数配置。这些 Prompt 用于驱动记忆检索、上下文注入和趋势分析。

## Session Warm-up

**触发条件：** 新对抗会话启动时
**用途：** 检索与当前工件最相关的历史记忆，注入各 Agent 的 System Prompt

### Prompt Template

```markdown
## 历史记忆检索指令

作为 D.A.R.E. 框架的记忆管理模块，请根据当前会话的上下文特征，从历史长期记忆中检索最相关的记录。

### 当前会话特征
- 阶段：{{stage}}
- 目标工件：{{target_artifact}}
- 技术栈：{{technology_tags.join(", ")}}
- 业务领域：{{business_domain}}
- 项目：{{project}}
- 团队：{{team}}

### 检索任务
1. 基于上述特征生成查询向量
2. 检索相似度最高的记忆记录（top_k={{top_k}}，min_similarity={{min_similarity}}）
3. 优先返回以下类型：
   - 与当前阶段相同的记录
   - 技术栈标签匹配的记录
   - 业务领域匹配的记录
4. 按相似度降序排列

### 输出格式
返回结构化的记忆上下文块，包含：
- 相关假设列表（含风险等级、验证状态）
- 常见问题模式列表（含出现频率）
- 相关决策历史（含对抗评分）

如果检索结果为空，返回明确提示："未找到相关历史记忆。"
```

### Parameters

```yaml
session_warmup:
  top_k: 5
  min_similarity: 0.75
  priority_filters:
    - field: "stage"
      weight: 0.4
    - field: "technology_tags"
      weight: 0.3
    - field: "business_domain"
      weight: 0.2
    - field: "project"
      weight: 0.1
  include_relations: true
  relation_depth: 1
```

## Inter-Stage Handoff

**触发条件：** 阶段切换时（如 REQ → ARCH，ARCH → CODE，CODE → TEST）
**用途：** 将前一阶段的关键假设和决策继承到下一阶段

### Prompt Template

```markdown
## 阶段切换记忆继承

当前会话从 {{previous_stage}} 阶段切换到 {{current_stage}} 阶段。
请检索前一阶段的关键记忆，供下一阶段参考。

### 前一阶段
- 阶段：{{previous_stage}}
- 会话ID：{{session_id}}

### 检索范围
1. 前一阶段中 {{previous_stage}} 的所有活动假设
2. 前一阶段达成的共识要点
3. 与下一阶段 {{current_stage}} 相关的历史决策

### 继承规则
- 标记为 "critical" 或 "high" 风险的假设必须继承
- 验证状态为 "verified" 的假设作为下一阶段的前提条件
- 验证状态为 "falsified" 的假设作为警示记录
- 与下一阶段技术栈相关的历史决策优先展示

### 输出格式
```
## 来自 {{previous_stage}} 阶段的关键继承

### 必须关注的假设（{{count}}条）
{{assumptions}}

### 已验证的前提条件
{{verified_assumptions}}

### 警示记录（已证伪的假设）
{{falsified_assumptions}}

### 相关历史决策
{{decisions}}
```
```

### Parameters

```yaml
inter_stage_handoff:
  previous_stage: "动态填入"
  current_stage: "动态填入"
  max_assumptions: 10
  risk_filter: ["critical", "high"]  # 必须继承的风险等级
  include_falsified: true           # 包含已证伪的假设作为警示
  include_verified_as_prerequisite: true
  cross_stage_similarity_boost: 0.1  # 跨阶段匹配时的相似度加成
```

## Real-time Association

**触发条件：** 发现新假设或新问题时
**用途：** 实时检索相似历史假设和相关模式，辅助当前分析

### Prompt Template

```markdown
## 实时关联检索

对抗过程中发现了新的记录，请检索历史中相似或相关的记忆。

### 新发现
- 类型：{{discovery_type}}  <!-- assumption | pattern | challenge -->
- 内容：{{discovery_content}}
- 当前阶段：{{stage}}
- 提出者：{{speaker}}
- 轮次：{{current_round}}

### 检索任务
1. 基于新发现的内容生成查询向量
2. 检索历史中最相似的记忆记录
3. 检查是否为已知问题的重复出现
4. 如发现相似记录，返回其验证历史和最终结论

### 关联类型判断
检索结果可能属于以下关联类型：
- **exact_match**: 与历史记录实质相同
- **similar**: 与历史记录高度相似但有差异
- **related**: 与历史记录存在间接关联
- **contradiction**: 与历史记录结论矛盾
- **none**: 未发现关联

### 输出格式
```
## 历史关联分析

### 关联判断：{{relation_type}}

{{#if similar_records}}
### 相似历史记录（{{count}}条）
{{#each similar_records}}
- [相似度 {{similarity}}] {{content}}
  历史结论：{{validation_status}}
  相关决策：{{related_decisions}}
{{/each}}
{{/if}}

{{#if pattern_match}}
### 匹配的问题模式
- {{pattern_name}}：{{description}}
  该模式已出现 {{occurrence_count}} 次，通常严重度为 {{typical_severity}}
{{/if}}

### 建议
{{advice}}
```
```

### Parameters

```yaml
realtime_association:
  top_k: 3
  min_similarity: 0.80        # 实时关联要求更高的相似度
  search_types: ["assumption", "pattern"]
  include_decision_context: true
  max_response_time_ms: 500   # 实时场景要求快速响应
  advice_generation: true     # 自动生成基于历史经验的建议
```

## Trend Analysis

**触发条件：** 会话结束时生成报告，或定期趋势分析
**用途：** 跨会话的趋势分析和模式识别

### Prompt Template

```markdown
## 跨会话趋势分析

请分析指定时间段内的对抗审查趋势。

### 分析范围
- 项目：{{project}}
- 团队：{{team}}
- 阶段：{{stage}}
- 时间范围：{{time_range.from}} 至 {{time_range.to}}
- 分组粒度：{{group_by}}

### 分析维度
1. **假设发现趋势**：各阶段假设的发现数量、验证率、 falsified 率
2. **问题模式频率**：重复出现的问题类型及其频率变化
3. **AHS 评分趋势**：对抗健康评分的变化趋势
4. **风险分布**：Critical/High/Medium/Low 风险的分布变化
5. **经验传承效率**：历史记忆的复用率和避免重复问题的效果

### 输出格式
```markdown
## D.A.R.E. 趋势分析报告

### 分析周期：{{time_range.from}} 至 {{time_range.to}}

### 1. 假设发现与验证趋势
- 总假设数：{{total_assumptions}}
- 验证率：{{verification_rate}}%
- falsified 率：{{falsified_rate}}%
- 趋势：{{trend_direction}}

### 2. 问题模式 Top 5
{{#each top_patterns}}
{{index}}. {{pattern_name}}（出现 {{occurrence_count}} 次）
   - 影响阶段：{{affected_stages}}
   - 频率趋势：{{frequency_trend}}
{{/each}}

### 3. AHS 评分趋势
- 平均评分：{{avg_ahs}}
- 趋势：{{ahs_trend}}
- 分项评分：
  - 假设覆盖度：{{ahs_breakdown.assumption_coverage}}
  - 魔鬼代言强度：{{ahs_breakdown.devil_advocacy}}
  - 证据质量：{{ahs_breakdown.evidence_quality}}
  - 共识清晰度：{{ahs_breakdown.consensus_clarity}}

### 4. 风险分布
```
Critical: ████████ {{critical_count}} ({{critical_pct}}%)
High:     ██████████ {{high_count}} ({{high_pct}}%)
Medium:   ██████ {{medium_count}} ({{medium_pct}}%)
Low:      ████ {{low_count}} ({{low_pct}}%)
```

### 5. 经验传承效果
- 历史记忆复用次数：{{reuse_count}}
- 因历史记忆避免的问题：{{prevented_issues}}
- 记忆命中率：{{memory_hit_rate}}%

### 建议
{{recommendations}}
```
```

### Parameters

```yaml
trend_analysis:
  default_time_range: "last_30_days"
  group_by_options: ["day", "week", "month"]
  default_group_by: "week"
  metrics:
    - assumption_count
    - verification_rate
    - pattern_frequency
    - avg_ahs
    - severity_distribution
    - memory_reuse_rate
  top_patterns_limit: 5
  include_recommendations: true
```

## Decision Tracing

**触发条件：** 评估历史决策效果，或需要追溯某个决策的完整上下文
**用途：** 获取特定决策的完整信息，包括当时的假设、辩论过程和后续效果

### Prompt Template

```markdown
## 决策溯源检索

请检索特定决策的完整上下文和后续追踪信息。

### 查询条件
- 决策ID：{{decision_id}}
- 决策摘要：{{decision_summary}}
- 阶段：{{stage}}

### 检索任务
1. 获取决策本身的完整记录
2. 检索决策时关联的所有假设及其验证状态
3. 检索决策引用的所有问题模式
4. 检索后续的追踪记录（followup_status, effectiveness_rating）
5. 检索之后会话中对该决策的引用或覆盖情况

### 输出格式
```markdown
## 决策溯源：{{decision_summary}}

### 基本信息
- 决策ID：{{decision_id}}
- 阶段：{{stage}}
- 决策时间：{{decided_at}}
- 所在会话：{{decided_in_session}}

### 决策上下文
{{context}}

### 对抗结论
{{dare_conclusion}}

### AHS 评分
- 总分：{{ahs_score}}
- 假设覆盖度：{{ahs_breakdown.assumption_coverage}}
- 魔鬼代言强度：{{ahs_breakdown.devil_advocacy}}
- 证据质量：{{ahs_breakdown.evidence_quality}}
- 共识清晰度：{{ahs_breakdown.consensus_clarity}}

### 相关假设（{{assumptions.length}}条）
{{#each assumptions}}
- [{{risk_level}}] {{content}}
  验证状态：{{validation_status}}
{{/each}}

### 反对意见
{{#if dissenting_views}}
{{#each dissenting_views}}
- {{this}}
{{/each}}
{{else}}
无反对意见
{{/if}}

### 后续追踪
- 跟进状态：{{followup_status}}
- 效果评估：{{effectiveness_rating}}
- 追踪备注：{{followup_notes}}
- 最后回顾：{{reviewed_at}}

### 后续引用
{{#if later_references}}
该决策在以下后续会话中被引用：
{{#each later_references}}
- {{session_id}}（{{reference_type}}）
{{/each}}
{{else}}
暂无后续引用记录
{{/if}}
```
```

### Parameters

```yaml
decision_tracing:
  include_full_context: true
  include_followup: true
  include_later_references: true
  later_reference_depth: 5       # 检索后续引用的最大深度
  relation_traversal_depth: 2    # 关联记忆遍历深度
```

## Deferred Assumption Revisit

**触发条件：** 新会话与历史 deferred 假设相关时
**用途：** 提醒审查者关注之前未解决的假设

### Prompt Template

```markdown
## 未解决假设提醒

当前会话可能涉及以下之前未解决的假设，请特别关注。

### 当前会话特征
- 阶段：{{stage}}
- 目标工件：{{target_artifact}}
- 技术栈：{{technology_tags.join(", ")}}

### 未解决假设（{{deferred_assumptions.length}}条）
{{#each deferred_assumptions}}
- [{{risk_level}}] {{content}}
  - 发现时间：{{discovered_at}}
  - 发现会话：{{discovered_session}}
  - 来源工件：{{source_artifact}}
  - 当前状态：{{validation_status}}
{{/each}}

### 建议
请在当前会话中评估以上假设是否仍然相关：
1. 如果相关，请在本轮对抗中重点验证
2. 如果不相关（由于架构变更或需求变化），请标记为 deprecated 并说明原因
3. 如果需要更多信息，请标记为 needs_more_info
```

### Parameters

```yaml
deferred_revisit:
  max_age_days: 30              # 只提醒30天内的 deferred 假设
  min_risk_level: "medium"      # 只提醒 medium 及以上风险
  similarity_threshold: 0.70    # 与当前工件的相关度阈值
  auto_include_critical: true   # critical 级别自动包含
  auto_include_high: true       # high 级别自动包含
```
