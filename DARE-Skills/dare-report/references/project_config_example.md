# Project Configuration Example — .dare/config.yaml

## Overview

This document provides a complete example of the project-level configuration file for the D.A.R.E. framework. Store this file as `.dare/config.yaml` at your project root.

## Full Configuration Example

```yaml
# ============================================
# D.A.R.E. Framework — Project Configuration
# ============================================

project:
  name: "my-awesome-service"
  id: "svc-2025-001"
  team: "platform-engineering"
  language: "typescript"
  framework: "nestjs"

# --------------------------------------------
# Stage Configuration
# --------------------------------------------
stages:
  REQ:
    enabled: true
    gate_policy:
      pass_threshold: 75
      conditional_threshold: 60
      block_on_critical: true
      block_on_high_count: 3
    score_weights:
      security: 0.25
      maintainability: 0.20
      performance: 0.15
      correctness: 0.25
      usability: 0.15
    required_participants:
      - "Devil-Req"
      - "Judge-Req"
    intensity_default: 3

  ARCH:
    enabled: true
    gate_policy:
      pass_threshold: 80
      conditional_threshold: 65
      block_on_critical: true
      block_on_high_count: 2
    score_weights:
      security: 0.25
      scalability: 0.25
      maintainability: 0.20
      performance: 0.15
      reliability: 0.15
    required_participants:
      - "Devil-Arch"
      - "Devil-Sec"
      - "Judge-Arch"
    intensity_default: 3

  CODE:
    enabled: true
    gate_policy:
      pass_threshold: 70
      conditional_threshold: 55
      block_on_critical: true
      block_on_high_count: 2
    score_weights:
      security: 0.30
      maintainability: 0.25
      performance: 0.25
      reliability: 0.20
    required_participants:
      - "Devil-Code"
      - "Devil-Sec"
      - "Judge-Code"
    intensity_default: 3
    file_patterns:
      include:
        - "src/**/*.ts"
        - "lib/**/*.py"
      exclude:
        - "**/*.test.ts"
        - "**/*.spec.ts"
        - "node_modules/**"

  TEST:
    enabled: true
    gate_policy:
      pass_threshold: 75
      conditional_threshold: 60
      block_on_critical: true
      block_on_high_count: 2
    score_weights:
      coverage: 0.30
      correctness: 0.30
      maintainability: 0.20
      reliability: 0.20
    required_participants:
      - "Devil-Test"
      - "Judge-Test"
    intensity_default: 3
    coverage_thresholds:
      line: 80
      branch: 70
      boundary: 60

# --------------------------------------------
# Severity Score Weights
# --------------------------------------------
severity_weights:
  critical: 25
  high: 15
  medium: 8
  low: 3

# --------------------------------------------
# Escalation Policy
# --------------------------------------------
escalation:
  enabled: true
  levels:
    L1:
      trigger: "critical_issue_found"
      notify: ["developer"]
      timeout: "2h"
    L2:
      trigger: "L1_timeout_or_unresolved_critical"
      notify: ["tech_lead"]
      timeout: "4h"
    L3:
      trigger: "L2_timeout"
      notify: ["architect", "engineering_manager"]
      timeout: "8h"

# --------------------------------------------
# Notification Configuration
# --------------------------------------------
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#dare-alerts"
    notify_on:
      - BLOCKED
      - escalation_triggered
  email:
    enabled: false
    recipients: []
    notify_on: []

# --------------------------------------------
# Reporting & Storage
# --------------------------------------------
storage:
  records_dir: ".dare/records"
  retention_days: 365
  compression_after_days: 90

dashboard:
  enabled: true
  update_interval: "daily"
  metrics:
    - issue_density_trend
    - critical_issue_ratio
    - average_fix_duration
    - recurring_issue_rate
    - adversarial_roi

# --------------------------------------------
# Effectiveness Targets
# --------------------------------------------
targets:
  quality_prevention_rate: 60        # percentage (> 60%)
  cost_saving_multiplier: 10         # each finding saves > 10x fix cost
  review_time_reduction: "30-50%"    # percentage
  coverage_improvement: 25           # percentage (+25%)
  team_satisfaction: 70              # percentage (> 70%)

# --------------------------------------------
# Integration Settings
# --------------------------------------------
integrations:
  git:
    provider: "github"    # github / gitlab / bitbucket
    require_dare_check: true
  cicd:
    provider: "github_actions"
    fail_pipeline_on_blocked: true
  sast:
    enabled: true
    tools:
      - "semgrep"
      - "sonarqube"
    merge_with_dare: true
```

## Configuration Field Reference

### `stages.{STAGE}.gate_policy`

| Field | Type | Description |
|-------|------|-------------|
| `pass_threshold` | integer | Minimum overall score to PASS |
| `conditional_threshold` | integer | Minimum score for CONDITIONAL (below this is BLOCKED) |
| `block_on_critical` | boolean | Whether any critical issue auto-blocks |
| `block_on_high_count` | integer | Number of high issues that trigger auto-block |

### `severity_weights`

Used in score calculation:
```
dimension_score = 100 - Σ(severity_weight × count) - baseline_penalty
```

### `escalation.levels`

| Level | Trigger | Timeout | Notifies |
|-------|---------|---------|----------|
| L1 | Critical issue found | 2h | Developer |
| L2 | L1 timeout / unresolved critical | 4h | Tech Lead |
| L3 | L2 timeout | 8h | Architect + EM |

### Environment Variable Substitution

Configuration supports environment variable substitution:
- `${SLACK_WEBHOOK_URL}` — Slack webhook URL
- `${GITHUB_TOKEN}` — GitHub API token
- Any `${VAR_NAME}` pattern is resolved at load time

## Minimal Configuration

For quick start, the minimal required configuration:

```yaml
project:
  name: "my-project"
  team: "my-team"

stages:
  CODE:
    enabled: true
    gate_policy:
      pass_threshold: 70
      block_on_critical: true
```

All other values use framework defaults.
