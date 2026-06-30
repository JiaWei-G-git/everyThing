---
name: dare-code
description: >
  D.A.R.E.框架代码阶段对抗审查（CODE-Challenger）。当Pull Request创建、代码合并前、安全敏感文件变更、或需要代码质量审查时触发。
  通过 Devil-Code、Devil-Sec、Devil-Maint 和 Judge-Code 挑战实现方案、扫描安全漏洞、评估可维护性、识别性能瓶颈。
  默认强度 Lv.3，支持合并阻塞（Gate）。
---

# D.A.R.E. 代码阶段对抗审查 (CODE-Challenger)

## 概述

CODE-Challenger 对代码变更进行实现方案挑战、安全漏洞扫描、可维护性评估和性能瓶颈识别。默认启用 Gate，可在合并前阻塞存在 Critical/High 问题的变更。

## 触发条件

- Pull Request 创建时
- 合并到主分支前
- 安全敏感文件变更（auth/security/crypto/password/token/permission 路径）
- 用户请求代码审查
- 夜间批量审查

## 角色定义

| 角色 | 职责 | 对抗视角 |
|------|------|----------|
| Devil-Code | 挑战实现方案的效率和正确性 | "这段排序在数据量超过1万时性能会急剧下降" |
| Devil-Sec | 模拟攻击者视角寻找漏洞 | "如果传入的ID是其他用户的，这个接口会泄露数据" |
| Devil-Maint | 评估代码长期可维护性 | "这个函数有15层嵌套if，三个月后没人敢改" |
| Judge-Code | 综合评分，判定是否阻塞合并 | 基于 CWE 等级和代码异味严重程度 |

## 默认配置

```yaml
default_level: 3
mode: debate
gate_enabled: true
gate_policy:
  critical_blocker: critical > 0 → BLOCKED
  high_threshold: high > 3 → BLOCKED
  security_score: scores.security < 70 → BLOCKED
  manual_override: 需二级审批 + 书面理由
```

## 对抗维度

| 维度 | 目标问题 | 映射到统一 dimension |
|------|----------|---------------------|
| 实现方案挑战 | 算法选择、数据结构、设计模式不当 | `correctness` |
| 安全漏洞扫描 | 注入、越权、敏感信息泄露 | `security` |
| 可维护性评估 | 代码复杂度、耦合度、可读性 | `maintainability` |
| 性能瓶颈识别 | 同步调用、资源泄漏、低效查询 | `performance` |

### 维度优先级

- P0（阻塞）: 安全漏洞 + 数据丢失风险
- P1（高）: 性能瓶颈 + 错误处理缺失
- P2（中）: 可维护性问题 + 代码异味
- P3（低）: 风格一致性 + 注释完善

## 安全敏感文件模式

当变更路径匹配以下模式时，自动提升强度至 Lv.4 并使用多 Agent 委员会：

```yaml
paths:
  - "**/auth/**"
  - "**/security/**"
  - "**/crypto/**"
  - "**/password/**"
  - "**/token/**"
  - "**/permission/**"
keywords_in_diff: [password, secret, token, encrypt, hash, sudo, eval(, exec(]
```

## 输出

输出必须遵循 `references/code_output_schema.json`，该 Schema 已与 `dare-report/references/unified_schema.json` 对齐。

核心字段：
- `record_id`, `stage`, `timestamp`, `intensity_level`
- `review_summary`（字符串，≤200字）
- `issues[]`：每个 issue 包含 `issue_id`, `dimension`, `severity`, `description`, `evidence`, `impact`, `recommendation`
- `scores`: `{ overall, security, maintainability, performance, reliability?, scalability? }`（可选维度无数据时省略）
- `gate_result`: `PASSED` / `CONDITIONAL` / `BLOCKED`
- `confidence_score`: 0.0-1.0
- `category`, `code_snippet`, `line_number`, `attack_vector`（CODE 阶段扩展）

## Claude Code 工具集成

1. **发现变更**
   - `Bash` 运行 `git diff` 或 `git diff --name-only` 获取变更文件
   - `Glob` 匹配安全敏感路径

2. **读取输入**
   - `Read` 读取代码 diff 和上下文
   - `Read` 读取 `references/code_output_schema.json` 和 `references/prompt_templates.md`

3. **执行审查**
   ```
   TaskCreate: "Devil-Code review code changes"
   TaskCreate: "Devil-Sec review code changes"
   TaskCreate: "Devil-Maint review code changes"
   ```

4. **Judge 裁决**
   - 使用 `TaskOutput` 收集输出
   - 调用 `Agent` 作为 Judge-Code 计算 scores 和 gate_result

5. **输出与阻塞**
   - 将结果写回 PR 评论或 CI 检查
   - `gate_result == BLOCKED` 时建议用户修复后再合并

## 参考资料

- `references/code_output_schema.json` — 阶段输出 Schema
- `references/prompt_templates.md` — Lv.1-Lv.5 完整 Prompt 模板
- `references/cwe_classification.md` — CWE 分类参考表
- `references/github_action_template.md` — GitHub Actions 集成
- `references/gitlab_ci_template.md` — GitLab CI 集成
- `../dare-core/references/intensity_matrix.md` — 强度矩阵
- `../dare-report/references/unified_schema.json` — 统一输出 Schema
- `../dare-report/references/report_templates/code_report_template.md` — 报告模板
