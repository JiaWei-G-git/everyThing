# Dashboard Metrics — D.A.R.E. Quality Dashboard

## Issue Density Trend (Issue密度趋势)

### Definition
每千行代码(或每千行需求/架构文档)发现的Issue数量随时间的变化趋势。

### Formula

```
Issue密度 = Issue总数 / (代码行数 / 1000)
```

对于非代码阶段:
- REQ阶段: `Issue密度 = Issue数 / (需求条目数 / 100)`
- ARCH阶段: `Issue密度 = Issue数 / (架构决策数 / 50)`
- TEST阶段: `Issue密度 = Issue数 / (测试用例数 / 100)`

### Time Series Calculation

```python
# 按周/月聚合
weekly_density = {
    week: len(issues_in_week) / (lines_changed_in_week / 1000)
    for week in time_windows
}

# 趋势判断
trend = "improving"   if current < previous * 0.9
trend = "stable"      if previous * 0.9 <= current <= previous * 1.1
trend = "degrading"   if current > previous * 1.1
```

### Alert Thresholds

| Threshold | Action |
|-----------|--------|
| 密度 > 15 issues/KLOC | 红色告警，触发架构回顾 |
| 密度 10-15 issues/KLOC | 黄色警告，增加审查强度 |
| 密度 5-10 issues/KLOC | 正常范围 |
| 密度 < 5 issues/KLOC | 优秀，可作为基准 |

---

## Critical Issue Ratio (严重Issue占比)

### Definition
Critical和High级别的Issue占全部发现Issue的比例，反映风险集中度。

### Formula

```
严重Issue占比 = (critical_count + high_count) / total_issue_count × 100%
```

### Risk Level Classification

| 占比范围 | 风险等级 | 建议动作 |
|----------|----------|----------|
| > 40% | 极高风险 | 立即停止，全面审查 |
| 25-40% | 高风险 | 升级至TL，制定修复计划 |
| 10-25% | 中等风险 | 常规跟踪，优先修复 |
| < 10% | 低风险 | 正常流程 |

### Trend Analysis

```python
critical_ratio_trend = moving_average(critical_ratios, window=4)  # 4周滑动窗口

if critical_ratio_trend[-1] > critical_ratio_trend[0] * 1.2:
    alert("严重Issue占比上升趋势")
```

---

## Average Fix Duration (平均修复时长)

### Definition
Issue从被发现到被解决(关闭)所花费的平均时间。

### Formula

```
平均修复时长 = Σ(issue.resolved_at - issue.created_at) / 已解决Issue数量
```

按严重级分层计算:

```
平均修复时长(按级别) = Σ(解决时间 - 发现时间) / 该级别已解决数量
```

### SLA Targets

| Severity | Target SLA | Escalation Point |
|----------|-----------|------------------|
| critical | 4 hours | 2 hours未响应自动升级 |
| high | 24 hours | 12 hours未响应升级 |
| medium | 72 hours | 48 hours未响应提醒 |
| low | 1 week | 不自动升级 |

### Efficiency Metric

```
修复效率 = SLA目标时长 / 实际平均修复时长

修复效率 > 1: 优于目标
修复效率 = 1: 达到目标
修复效率 < 1: 低于目标
```

---

## Recurring Issue Rate (重复Issue率)

### Definition
同类问题在不同对抗会话中反复出现的频率，用于识别系统性薄弱环节。

### Similarity Calculation

```python
def calculate_similarity(issue_a, issue_b):
    """计算两个Issue的相似度分数 (0-100%)"""
    dimension_match = 25 if issue_a.dimension == issue_b.dimension else 0
    severity_match = 25 if issue_a.severity == issue_b.severity else 0
    description_similarity = text_similarity(issue_a.description, issue_b.description) * 30
    location_similarity = location_match(issue_a.location, issue_b.location) * 20

    return dimension_match + severity_match + description_similarity + location_similarity

# 标记重复
if similarity >= 80%:
    mark_as_recurring(issue_b, reference=issue_a)
```

### Formula

```
重复Issue率 = 重复Issue数 / 总Issue数 × 100%
```

重复Issue判定条件:
- 同一维度 + 同一严重级 + 描述相似度≥70% + 30天内再次发现

### Systematic Weakness Detection

当某个维度的重复率持续高于25%时，标记为系统性薄弱环节:

```
维度重复率 = 该维度重复Issue数 / 该维度总Issue数

if 维度重复率 > 25% for 连续3次对抗:
    flag_systematic_weakness(dimension)
    recommend_training_or_process_change(dimension)
```

---

## Adversarial ROI (对抗收益比)

### Definition
对抗过程发现问题的价值与执行对抗所消耗成本的比率。

### Formula

```
对抗收益比 = 预估避免损失 / 对抗执行成本

预估避免损失 = Σ(issue_severity_value × detection_stage_multiplier)
对抗执行成本 = agent_compute_time × cost_per_hour + human_review_time × hourly_rate
```

### Severity Value Mapping

| Severity | 预估修复成本(生产环境) | 预估修复成本(早期发现) |
|----------|----------------------|----------------------|
| critical | $50,000 - $500,000 | $500 - $5,000 |
| high | $10,000 - $50,000 | $200 - $2,000 |
| medium | $2,000 - $10,000 | $100 - $500 |
| low | $200 - $2,000 | $50 - $200 |

### Stage Multiplier

| Stage | 成本节省倍数 | 说明 |
|-------|-------------|------|
| REQ | 100x | 需求阶段发现避免全部下游返工 |
| ARCH | 50x | 架构阶段发现避免设计和实现返工 |
| CODE | 10x | 代码阶段发现避免测试和部署返工 |
| TEST | 5x | 测试阶段发现避免生产事故 |

### ROI Interpretation

| ROI范围 | 评价 | 建议 |
|---------|------|------|
| > 50x | 极佳 | 扩大对抗覆盖范围 |
| 20-50x | 良好 | 保持当前配置 |
| 10-20x | 一般 | 优化对抗效率 |
| < 10x | 需改进 | 审视对抗流程 |

---

## Effectiveness Scorecard (效果评分卡)

### Composite Score

```
效果综合分 = (
    质量预防率 × 0.30 +
    成本节省率 × 0.25 +
    效率提升率 × 0.20 +
    覆盖增强率 × 0.15 +
    团队满意度 × 0.10
)
```

### Individual Metric Calculations

**1. 质量预防率 (Quality Prevention Rate)**
```
质量预防率 = 可被对抗发现的生产Bug数 / 总生产Bug数 × 100%
目标: > 60%
```

**2. 成本节省率 (Cost Saving Rate)**
```
成本节省率 = (生产修复成本 - 对抗成本) / 生产修复成本 × 100%
目标: 每个发现节省 > 10x修复成本
```

**3. 效率提升率 (Efficiency Improvement)**
```
效率提升率 = (人工审查原时长 - 现时长) / 人工审查原时长 × 100%
目标: 30-50%
```

**4. 覆盖增强率 (Coverage Enhancement)**
```
覆盖增强率 = (对抗后边界条件覆盖率 - 对抗前覆盖率) / 对抗前覆盖率 × 100%
目标: +25%
```

**5. 团队满意度 (Team Satisfaction)**
```
团队满意度 = 认为"有帮助"的开发者数 / 参与调查的开发者数 × 100%
目标: > 70%
```

### Scorecard Grading

| 综合分 | 等级 | 颜色 |
|--------|------|------|
| > 85 | A (优秀) | 绿色 |
| 70-85 | B (良好) | 蓝绿色 |
| 55-70 | C (合格) | 黄色 |
| 40-55 | D (需改进) | 橙色 |
| < 40 | F (不合格) | 红色 |

---

## Aggregation Periods

| 周期 | 用途 | 最小样本量 |
|------|------|-----------|
| 周报 | 快速反馈，及时发现问题 | 5次对抗 |
| 月报 | 趋势分析，资源配置 | 20次对抗 |
| 季报 | 战略评估，流程优化 | 60次对抗 |
| 项目总结 | 整体效果评估 | 全量数据 |
