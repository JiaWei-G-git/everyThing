# GitLab CI 集成配置模板

> D.A.R.E. 代码阶段对抗审查的 GitLab CI/CD 集成配置。

## 基础配置

### 1. PR（Merge Request）创建时审查 (Lv.3)

```yaml
# .gitlab-ci.yml - DARE Code Review Integration
stages:
  - dare-review
  - dare-gate

variables:
  DARE_REVIEW_LEVEL: "3"
  DARE_REVIEW_MODE: "debate"
  DARE_BLOCK_ON_CRITICAL: "true"
  DARE_BLOCK_ON_HIGH_THRESHOLD: "3"
  DARE_MIN_SECURITY_SCORE: "70"

# 检测安全敏感变更
.dare-security-sensitive:
  script:
    - |
      if git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA | grep -qiE '(auth|security|crypto|password|token|permission|credential|secret|\.key|\.pem)'; then
        echo "DARE_REVIEW_LEVEL=4" >> dare.env
        echo "DARE_REVIEW_MODE=council" >> dare.env
        echo "IS_SECURITY_SENSITIVE=true" >> dare.env
      else
        echo "DARE_REVIEW_LEVEL=3" >> dare.env
        echo "DARE_REVIEW_MODE=debate" >> dare.env
        echo "IS_SECURITY_SENSITIVE=false" >> dare.env
      fi

# DARE 代码审查 Job
dare-code-review:
  stage: dare-review
  image: alpine:latest
  variables:
    GIT_DEPTH: 0  # 需要完整历史
  before_script:
    - apk add --no-cache git curl jq
  script:
    # 加载环境变量（可能由安全检测job覆盖）
    - if [ -f dare.env ]; then source dare.env; fi
    
    # 获取MR diff
    - git fetch origin $CI_MERGE_REQUEST_SOURCE_BRANCH_NAME
    - git diff $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA > mr_diff.txt
    
    # 构建审查请求
    - |
      cat > review_request.json << EOF
      {
        "project_id": "$CI_PROJECT_ID",
        "merge_request_iid": "$CI_MERGE_REQUEST_IID",
        "source_branch": "$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME",
        "target_branch": "$CI_MERGE_REQUEST_TARGET_BRANCH_NAME",
        "commit_sha": "$CI_COMMIT_SHA",
        "diff_base64": "$(base64 -w 0 mr_diff.txt)",
        "level": ${DARE_REVIEW_LEVEL:-3},
        "mode": "${DARE_REVIEW_MODE:-debate}",
        "changed_files": $(git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA | jq -R -s -c 'split("\n")[:-1]'),
        "metadata": {
          "author": "$GITLAB_USER_NAME",
          "author_email": "$GITLAB_USER_EMAIL",
          "pipeline_id": "$CI_PIPELINE_ID",
          "job_id": "$CI_JOB_ID"
        }
      }
      EOF
    
    # 调用DARE审查服务
    # - |
    #   curl -X POST "$DARE_API_URL/review" \
    #     -H "Content-Type: application/json" \
    #     -H "Authorization: Bearer $DARE_API_TOKEN" \
    #     -d @review_request.json > review_result.json
    
    # 保存结果作为artifact
    - echo "审查请求已构建，等待Agent执行"
    
  artifacts:
    reports:
      dotenv: dare.env
    paths:
      - review_result.json
      - review_request.json
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - src/**/*
        - lib/**/*
        - app/**/*
        - "**/*.py"
        - "**/*.js"
        - "**/*.ts"
        - "**/*.java"
        - "**/*.go"
  allow_failure: false

# Gate检查 Job
dare-gate-check:
  stage: dare-gate
  image: alpine:latest
  needs:
    - job: dare-code-review
      artifacts: true
  script:
    - apk add --no-cache jq
    
    # 模拟从review_result.json读取结果
    # 实际应从review_result.json解析
    
    - |
      echo "=== D.A.R.E. Gate 检查 ==="
      echo "审查强度: ${DARE_REVIEW_LEVEL}"
      echo "安全敏感: ${IS_SECURITY_SENSITIVE}"
      
      # 从审查结果检查阻塞条件
      # CRITICAL_COUNT=$(jq '.issues[] | select(.severity == "Critical") | length' review_result.json)
      # HIGH_COUNT=$(jq '.issues[] | select(.severity == "High") | length' review_result.json)
      # SECURITY_SCORE=$(jq '.security_score' review_result.json)
      
      # Lv.3 阻塞条件: Critical>0 或 High>3 或 security_score<70
      # if [ "$CRITICAL_COUNT" -gt 0 ]; then
      #   echo "发现 $CRITICAL_COUNT 个Critical问题，阻塞合并"
      #   exit 1
      # fi
      # 
      # if [ "$HIGH_COUNT" -gt 3 ]; then
      #   echo "发现 $HIGH_COUNT 个High问题（阈值3），阻塞合并"
      #   exit 1
      # fi
      
      echo "Gate检查通过"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: false
```

### 2. 合并到主分支前快速扫描 (Lv.2)

```yaml
# 添加到 stages: dare-pre-merge
dare-pre-merge-scan:
  stage: dare-review
  image: alpine:latest
  variables:
    GIT_DEPTH: 0
    DARE_REVIEW_LEVEL: "2"
    DARE_REVIEW_MODE: "single"
  before_script:
    - apk add --no-cache git curl jq
  script:
    - |
      # Lv.2: Devil-Maint 快速扫描
      cat > scan_request.json << EOF
      {
        "commit_sha": "$CI_COMMIT_SHA",
        "level": 2,
        "mode": "single",
        "primary_role": "Devil-Maint",
        "target_branch": "$CI_COMMIT_BRANCH"
      }
      EOF
      echo "Lv.2快速扫描请求已构建"
  
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: always
    - if: $CI_COMMIT_BRANCH =~ /^release\//
      when: always
  allow_failure: false
```

### 3. 安全敏感文件变更 (Lv.4)

```yaml
# 安全文件检测 Job
dare-security-detect:
  stage: dare-review
  image: alpine:latest
  script:
    - |
      CHANGED_FILES=$(git diff --name-only $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA 2>/dev/null || echo "")
      
      SECURITY_PATTERNS='auth|security|crypto|password|token|permission|credential|secret|\.(key|pem|crt|p12)$'
      
      if echo "$CHANGED_FILES" | grep -qiE "$SECURITY_PATTERNS"; then
        echo "检测到安全敏感文件变更"
        echo "DARE_REVIEW_LEVEL=4" >> dare.env
        echo "DARE_REVIEW_MODE=council" >> dare.env
        echo "DARE_AGENTS=Devil-Code,Devil-Sec,Devil-Maint" >> dare.env
        echo "SECURITY_REVIEW_REQUIRED=true" >> dare.env
      else
        echo "未检测到安全敏感变更"
        echo "SECURITY_REVIEW_REQUIRED=false" >> dare.env
      fi
  artifacts:
    reports:
      dotenv: dare.env
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# Lv.4 安全委员会审查
dare-security-council:
  stage: dare-review
  image: alpine:latest
  needs:
    - job: dare-security-detect
      artifacts: true
  variables:
    GIT_DEPTH: 0
  before_script:
    - apk add --no-cache git curl jq
    - if [ -f dare.env ]; then source dare.env; fi
  script:
    - |
      if [ "$SECURITY_REVIEW_REQUIRED" != "true" ]; then
        echo "无需安全审查，跳过"
        exit 0
      fi
      
      # Lv.4 多Agent委员会审查
      cat > council_request.json << EOF
      {
        "commit_sha": "$CI_COMMIT_SHA",
        "level": 4,
        "mode": "council",
        "agents": ["Devil-Code", "Devil-Sec", "Devil-Maint"],
        "special_rules": {
          "devil_sec_veto": true,
          "business_logic_validation": true,
          "dependency_cve_check": true,
          "crypto_correctness": true,
          "audit_trail_validation": true
        }
      }
      EOF
      echo "Lv.4安全委员会审查已触发"
  
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: false

# Lv.4 安全Gate
dare-security-gate:
  stage: dare-gate
  needs:
    - job: dare-security-council
      artifacts: true
  script:
    - |
      # Lv.4 阻塞条件: High > 0
      # HIGH_COUNT=$(jq '[.issues[] | select(.severity == "High")] | length' review_result.json)
      # if [ "$HIGH_COUNT" -gt 0 ]; then
      #   echo "Lv.4安全Gate: 发现High级别问题，阻塞合并"
      #   exit 1
      # fi
      echo "安全Gate检查完成"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: false
```

### 4. 夜间批量扫描 (Lv.2)

```yaml
# 使用 GitLab Pipeline Schedule 触发
dare-nightly-scan:
  stage: dare-review
  image: alpine:latest
  variables:
    GIT_DEPTH: 0
    DARE_REVIEW_LEVEL: "2"
    DARE_REVIEW_MODE: "self_adversarial"
  before_script:
    - apk add --no-cache git curl jq
  script:
    - |
      # 全量代码库自对抗扫描
      cat > nightly_request.json << EOF
      {
        "scan_type": "full_codebase",
        "level": 2,
        "mode": "self_adversarial",
        "self_critique": true,
        "include_paths": ["src/", "lib/", "app/"],
        "exclude_paths": ["vendor/", "node_modules/", ".git/"]
      }
      EOF
      
      # 生成扫描报告
      TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
      echo "scan_timestamp=$TIMESTAMP" >> dare.env
      echo "Nightly扫描完成: $TIMESTAMP"
  
  artifacts:
    paths:
      - nightly-report.json
    expire_in: 30 days
  # 仅由pipeline schedule触发
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: always
    - when: never
```

### 5. 合并请求评论集成

```yaml
# 使用 GitLab API 发布审查评论
dare-post-comment:
  stage: dare-gate
  image: alpine:latest
  needs:
    - job: dare-code-review
      artifacts: true
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      # 构建审查评论
      COMMENT_BODY=$(cat << 'EOF' | jq -s -R .
## D.A.R.E. Code Review Report

| 指标 | 值 |
|------|-----|
| 审查强度 | Lv.${DARE_REVIEW_LEVEL} |
| 审查模式 | ${DARE_REVIEW_MODE} |
| 安全敏感 | ${IS_SECURITY_SENSITIVE} |

### 评分
- 安全评分: TBD
- 可维护性评分: TBD
- 性能评分: TBD

### 问题统计
| 级别 | 数量 |
|------|------|
| Critical | TBD |
| High | TBD |
| Medium | TBD |
| Low | TBD |

---
*由 D.A.R.E. 框架自动生成*
EOF
)
      
      # 发布到Merge Request
      curl -X POST "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes" \
        -H "PRIVATE-TOKEN: $GITLAB_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\": $COMMENT_BODY}"
  
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  allow_failure: true  # 评论失败不应阻塞流程
```

## 高级配置

### 条件执行矩阵

```yaml
# 根据文件类型和分支选择审查策略
.dare-rules:
  rules:
    # 主分支: 严格审查
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      variables:
        DARE_REVIEW_LEVEL: "4"
    # Release分支: 严格审查
    - if: $CI_COMMIT_BRANCH =~ /^release\//
      variables:
        DARE_REVIEW_LEVEL: "4"
    # Feature分支: 标准审查
    - if: $CI_COMMIT_BRANCH =~ /^feature\//
      variables:
        DARE_REVIEW_LEVEL: "3"
    # Hotfix分支: 安全审查
    - if: $CI_COMMIT_BRANCH =~ /^hotfix\//
      variables:
        DARE_REVIEW_LEVEL: "4"
    # 其他: 快速扫描
    - variables:
        DARE_REVIEW_LEVEL: "2"
```

### 增量审查配置

```yaml
# 只审查变更的部分
dare-incremental-review:
  stage: dare-review
  script:
    - |
      # 获取变更文件和行号范围
      git diff -U0 $CI_MERGE_REQUEST_DIFF_BASE_SHA...$CI_COMMIT_SHA > diff.txt
      
      # 提取变更范围用于精确审查
      awk '/^@@/ {print}' diff.txt > changed_lines.txt
      
      cat > incremental_request.json << EOF
      {
        "incremental": true,
        "changed_lines": "$(cat changed_lines.txt | base64 -w 0)",
        "full_files": false,
        "context_lines": 5
      }
      EOF
```

### 与SonarQube集成

```yaml
# 在DARE审查前运行SonarQube，将结果作为上下文
dare-with-sonar-context:
  stage: dare-review
  needs:
    - job: sonarqube-check
      artifacts: true
  script:
    - |
      # 读取SonarQube报告作为上下文
      SONAR_ISSUES=$(cat sonar-report.json | base64 -w 0)
      
      cat > review_with_context.json << EOF
      {
        "existing_analysis": {
          "sonarqube": "$SONAR_ISSUES"
        },
        "focus_areas": ["sonarqube未覆盖的安全问题"]
      }
      EOF
```

## 必需 CI/CD Variables

| 变量名 | 说明 | 设置位置 | 必需 |
|--------|------|----------|------|
| `DARE_API_URL` | DARE审查服务地址 | CI/CD Settings | 是 |
| `DARE_API_TOKEN` | DARE服务认证Token | CI/CD Settings > Variables | 是 |
| `OPENAI_API_KEY` | OpenAI API Key | CI/CD Settings > Variables | 是* |
| `GITLAB_API_TOKEN` | 用于发布MR评论 | CI/CD Settings > Variables | 否 |

* 取决于使用的LLM提供商

## Pipeline Schedule 配置

1. 进入项目 Settings > CI/CD > Pipeline schedules
2. 创建新Schedule:
   - **描述**: DARE Nightly Scan
   - **间隔模式**: `0 2 * * *` (每天凌晨2点)
   - **目标分支**: `main`
   - **变量**: `DARE_REVIEW_LEVEL=2`
3. 保存并激活

## 审查结果Badge

```markdown
<!-- README.md 中添加状态徽章 -->
[![DARE Review](https://img.shields.io/badge/DARE-Lv.3%20Passing-green)](link-to-report)
[![DARE Security Score](https://img.shields.io/badge/Security%20Score-85-blue)](link-to-report)
```
