---
name: dare-code
description: |
  D.A.R.E.框架代码阶段对抗审查（CODE-Challenger）。通过Devil-Code（代码批判者）、
  Devil-Sec（安全攻击者）、Devil-Maint（维护批判者）和Judge-Code（代码裁决者）四个角色，
  对代码变更进行实现方案挑战、安全漏洞扫描、可维护性评估和性能瓶颈识别。
  当Pull Request创建、代码合并前、安全敏感文件变更、或需要代码质量审查时触发。
  默认强度Lv.3，支持合并阻塞（Gate）。
---

# D.A.R.E. 代码阶段对抗审查 (CODE-Challenger)

> **触发条件**: Pull Request 创建 / 合并前审查 / 安全敏感文件变更 / 代码质量审查请求
> **默认强度**: Lv.3 | **阻塞模式**: Gate 启用

## 1. 角色体系

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| Devil-Code | 挑战实现方案的效率和正确性 | "这段排序在数据量超过1万时性能会急剧下降" |
| Devil-Sec | 模拟攻击者视角寻找漏洞 | "如果传入的ID是其他用户的，这个接口会泄露数据" |
| Devil-Maint | 评估代码长期可维护性 | "这个函数有15层嵌套if，三个月后没人敢改" |
| Judge-Code | 综合评分，判定是否阻塞合并 | 基于CWE等级和代码异味严重程度判定 |

### 1.1 角色调用规则

```yaml
role_dispatch:
  pull_request_created:
    roles: [Devil-Code, Devil-Sec]
    mode: debate
    level: 3

  pre_merge:
    roles: [Devil-Maint]
    mode: single
    level: 2

  security_file_changed:
    roles: [Devil-Code, Devil-Sec, Devil-Maint]
    mode: council
    level: 4

  nightly_batch:
    roles: [self]
    mode: self_adversarial
    level: 2
```

## 2. 对抗维度与目标

| 对抗维度 | 目标问题 | 典型遗漏场景 |
|----------|----------|-------------|
| 实现方案挑战 | 算法选择、数据结构、设计模式的不当使用 | O(n²)算法处理百万级数据 |
| 安全漏洞扫描 | 注入、越权、敏感信息泄露等安全问题 | 信任前端传入参数未做服务端校验 |
| 可维护性评估 | 代码复杂度、耦合度、可读性问题 | 单函数超过200行且承担多种职责 |
| 性能瓶颈识别 | 同步调用、资源泄漏、低效查询 | N+1查询、未使用连接池 |

### 2.1 维度优先级矩阵

```
P0 (阻塞): 安全漏洞 + 数据丢失风险
P1 (高):   性能瓶颈 + 错误处理缺失
P2 (中):   可维护性问题 + 代码异味
P3 (低):   风格一致性 + 注释完善
```

## 3. 审查强度配置

### 3.1 全强度差异矩阵

| 强度 | 安全审查范围 | 代码异味阈值 | 性能分析 | 阻塞条件 |
|------|-------------|-------------|----------|----------|
| Lv.1 | 明显漏洞（明文密码等） | 仅Critical | 无 | 从不 |
| Lv.2 | CWE Top 10 | High+ | Big-O提示 | Critical>0 |
| Lv.3 | 自定义威胁模型 | Medium+ | 资源使用分析 | Critical>0或High>3 |
| Lv.4 | 全攻击面扫描 | All | 基准测试要求 | High>0 |
| Lv.5 | 渗透测试级别 | All + 风格 | 性能合约 | 任何Medium+ |

### 3.2 强度选择指引

```yaml
level_selection:
  Lv.1: "快速扫描，仅拦截明显安全问题，适用于内部工具/原型代码"
  Lv.2: "标准PR审查，覆盖CWE Top 10，适用于常规功能开发"
  Lv.3: "严格审查，自定义威胁模型，适用于生产代码（默认）"
  Lv.4: "安全敏感，全攻击面扫描，适用于支付/认证/授权代码"
  Lv.5: "最高级别，渗透测试标准，适用于核心安全组件"
```

## 4. 合并阻塞条件 (Gate Condition)

以下任一条件满足时，自动阻塞合并：

```yaml
gate_conditions:
  critical_blocker:
    condition: "Critical级别问题数 > 0"
    action: "立即阻塞，需修复后重新审查"

  high_threshold:
    condition: "High级别问题数 > 3"
    action: "阻塞合并，需修复或人工豁免"

  security_score:
    condition: "安全评分 < 70"
    action: "阻塞合并，需安全团队确认"

  manual_override:
    condition: "维护者手动标记为豁免"
    action: "记录审计日志，允许合并"
    requirement: "需二级审批 + 书面理由"
```

### 4.1 Gate 状态流转

```
[审查触发] → [Agent审查] → [Judge-Code评分]
                              ↓
                    ┌─ 通过 → [允许合并]
                    │
                    └─ 阻塞 → [问题修复] → [重新审查] ─┐
                                                       │
                    └─ 人工豁免 → [审计记录] → [允许合并]
```

## 5. Lv.3 审查专用 Prompt 模板

### 5.1 主审查 Prompt

```markdown
## 角色设定
你是一位{{role_name}}，审查以下代码变更。
你的目标是：如果这段代码明天进入生产环境，你会因为什么问题被半夜叫醒？

## 对抗强度: Level {{level}} ({{level_name}})
{{intensity_instructions}}

## 审查输入
文件路径: {{file_path}}
变更类型: {{change_type}}  <!-- add/modify/delete -->
语言/框架: {{language}}

```diff
{{code_diff}}
```

相关上下文:
{{context}}

## 审查维度
1. **实现方案挑战** (Devil-Code):
   - 算法复杂度Big-O分析
   - 更高效实现方式建议
   - 边界条件处理完整性
   - 并发安全性

2. **安全漏洞扫描** (Devil-Sec):
   - 输入验证完整性
   - 身份认证与授权
   - 敏感数据处理
   - 注入攻击风险（SQL/命令/XXE/LDAP）
   - 按CWE分类标注

3. **可维护性评估** (Devil-Maint):
   - 圈复杂度是否>10
   - 函数职责是否单一
   - 命名是否清晰表达意图
   - 重复代码检测
   - 测试覆盖率评估

4. **性能瓶颈识别** (Judge-Code):
   - 同步阻塞调用
   - 数据库查询优化（N+1检测）
   - 内存泄漏风险
   - 资源释放保证

## 输出要求
严格遵循JSON Schema格式输出: /references/code_output_schema.json

评分标准:
- security_score: 0-100（100=无安全问题）
- maintainability_score: 0-100（100=完美可维护）
- performance_score: 0-100（100=无性能问题）
- 每个issue必须包含: issue_id, line_number, dimension, severity, category, description, code_snippet, evidence, recommendation, attack_vector
```

### 5.2 双Agent辩论 Prompt

```markdown
## 辩论模式: Devil-Code vs Devil-Sec

第一轮: 各自独立审查，输出发现的问题列表
第二轮: 针对对方发现的问题进行质疑和挑战
第三轮: 交叉验证，确认问题真实性和严重程度

最终: Judge-Code 综合双方观点，输出统一评分和结论

输出格式: 按 references/code_output_schema.json 的 "multi_agent_debate" 格式
```

## 6. CI/CD 触发配置

| 触发时机 | 推荐模式 | 强度 |
|----------|----------|------|
| Pull Request 创建时 | 双Agent辩论 (Devil-Code vs Devil-Sec) | Lv.3 |
| 合并到主分支前 | 单Agent快速扫描 (Devil-Maint) | Lv.2 |
| 安全敏感文件变更 | 多Agent委员会 (增加Devil-Sec+) | Lv.4 |
| 夜间批量审查 | 单Agent自对抗扫描全量代码 | Lv.2 |

### 6.1 安全敏感文件模式

```yaml
security_sensitive_patterns:
  paths:
    - "**/auth/**"
    - "**/security/**"
    - "**/crypto/**"
    - "**/password/**"
    - "**/token/**"
    - "**/permission/**"
  file_types:
    - "*.key"
    - "*.pem"
    - "*.crt"
    - "*secret*"
    - "*credential*"
  keywords_in_diff:
    - "password"
    - "secret"
    - "token"
    - "encrypt"
    - "hash"
    - "sudo"
    - "eval("
    - "exec("
```

## 7. 输出格式规范

所有审查结果必须遵循 JSON Schema: `/references/code_output_schema.json`

核心字段说明:

```yaml
output_fields:
  file_path: "被审查文件的绝对路径"
  review_summary: "整体审查结论，不超过200字"
  issues: "发现的问题列表，每个issue包含完整上下文"
  scores:
    security_score: "安全评分 0-100，100表示无安全问题"
    maintainability_score: "可维护性评分 0-100"
    performance_score: "性能评分 0-100"
  blocker_count: "阻塞合并的问题数量统计（Critical + High>3）"
  confidence_score: "Agent对审查结果的置信度 0-100"
```

### 7.1 Severity 定义

| 级别 | 定义 | 响应时效 |
|------|------|----------|
| Critical | 可导致系统被入侵、数据泄露、服务中断 | 立即修复 |
| High | 明显缺陷，可能在生产环境引发故障 | 24小时内 |
| Medium | 代码异味，长期影响可维护性 | 当前Sprint |
| Low | 风格问题，建议改进 | 下次迭代 |
| Info | 提示性建议，不阻塞 | 可选 |

## 8. 质量门禁 (Quality Gate)

```yaml
quality_gate:
  production:
    min_security_score: 70
    max_critical_issues: 0
    max_high_issues: 3
    min_confidence: 80

  staging:
    min_security_score: 60
    max_critical_issues: 0
    max_high_issues: 5

  development:
    min_security_score: 50
    max_critical_issues: 1
    max_high_issues: 10
```

## 9. 集成模板

- **GitHub Actions**: 参考 `/references/github_action_template.md`
- **GitLab CI**: 参考 `/references/gitlab_ci_template.md`
- **完整Prompt模板 (Lv.1-Lv.5)**: 参考 `/references/prompt_templates.md`
- **CWE分类参考表**: 参考 `/references/cwe_classification.md`

## 10. 使用流程

```
1. 代码变更提交 → 2. CI触发审查 → 3. Agent角色分配
                                    ↓
4. 对抗审查执行 → 5. Judge-Code评分 → 6. Gate判定
                                          ↓
                              ┌─ 通过 → 7a. 允许合并
                              │
                              └─ 阻塞 → 7b. 返回修复 → 回到步骤1
```

## 11. 示例审查结论

```json
{
  "file_path": "/src/api/user_controller.py",
  "review_summary": "发现1个Critical安全漏洞（SQL注入）和2个High性能问题（N+1查询）。安全评分45，建议立即修复后重新审查。",
  "issues": [
    {
      "issue_id": "DARE-CODE-001",
      "line_number": 42,
      "dimension": "安全漏洞扫描",
      "severity": "Critical",
      "category": "CWE-89",
      "description": "用户输入直接拼接到SQL查询中，存在SQL注入漏洞",
      "code_snippet": "query = f\"SELECT * FROM users WHERE id = {user_id}\"",
      "evidence": "user_id来自HTTP请求参数，未经过参数化处理",
      "recommendation": "使用ORM参数化查询: User.objects.filter(id=user_id)",
      "attack_vector": "攻击者可构造user_id=' OR '1'='1'绕过认证"
    }
  ],
  "security_score": 45,
  "maintainability_score": 72,
  "performance_score": 38,
  "blocker_count": 1,
  "confidence_score": 95
}
```

---

**参考文档**:
- `/references/code_output_schema.json` — 完整JSON输出Schema
- `/references/cwe_classification.md` — CWE分类参考表
- `/references/prompt_templates.md` — Lv.1-Lv.5完整Prompt模板
- `/references/github_action_template.md` — GitHub Actions集成
- `/references/gitlab_ci_template.md` — GitLab CI集成
