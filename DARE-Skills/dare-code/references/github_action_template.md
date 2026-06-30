# GitHub Actions 集成配置模板

> D.A.R.E. 代码阶段对抗审查的 GitHub Actions 集成配置。

## 基础配置

### 1. PR创建时触发审查 (默认Lv.3)

```yaml
# .github/workflows/dare-code-pr-review.yml
name: D.A.R.E. Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/**'
      - 'lib/**'
      - 'app/**'
      - '**/*.py'
      - '**/*.js'
      - '**/*.ts'
      - '**/*.java'
      - '**/*.go'
      - '**/*.rb'

jobs:
  dare-code-review:
    name: DARE Code Adversarial Review
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      issues: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 需要完整历史获取diff

      - name: Get PR diff
        id: diff
        run: |
          git fetch origin ${{ github.base_ref }}
          git diff origin/${{ github.base_ref }}...HEAD > pr_diff.txt
          echo "diff_size=$(wc -c < pr_diff.txt)" >> $GITHUB_OUTPUT

      - name: Detect change scope
        id: scope
        run: |
          # 检测变更文件类型和范围
          CHANGED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)
          echo "changed_files<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED_FILES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

          # 检测安全敏感文件
          if echo "$CHANGED_FILES" | grep -qiE '(auth|security|crypto|password|token|permission|credential|secret)'; then
            echo "is_security_sensitive=true" >> $GITHUB_OUTPUT
            echo "review_level=4" >> $GITHUB_OUTPUT
            echo "review_mode=council" >> $GITHUB_OUTPUT
          else
            echo "is_security_sensitive=false" >> $GITHUB_OUTPUT
            echo "review_level=3" >> $GITHUB_OUTPUT
            echo "review_mode=debate" >> $GITHUB_OUTPUT
          fi

      - name: DARE Code Review
        id: dare_review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cat > review_payload.json << 'PAYLOAD'
          {
            "file_path": "${{ github.workspace }}",
            "diff": "$(base64 -w 0 pr_diff.txt)",
            "language": "auto-detect",
            "level": ${{ steps.scope.outputs.review_level }},
            "mode": "${{ steps.scope.outputs.review_mode }}",
            "roles": ["Devil-Code", "Devil-Sec", "Devil-Maint", "Judge-Code"],
            "context": {
              "pr_title": "${{ github.event.pull_request.title }}",
              "pr_body": "${{ github.event.pull_request.body }}",
              "author": "${{ github.event.pull_request.user.login }}",
              "changed_files": "${{ steps.scope.outputs.changed_files }}"
            }
          }
          PAYLOAD

          # 调用DARE审查服务（需替换为实际服务URL或本地Agent调用）
          # curl -X POST "$DARE_API_URL/review" -d @review_payload.json > review_result.json

          echo "review_completed=true" >> $GITHUB_OUTPUT

      - name: Post review comment
        if: steps.dare_review.outputs.review_completed == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            // const result = JSON.parse(fs.readFileSync('review_result.json', 'utf8'));

            // 生成审查报告评论
            const reviewBody = `## D.A.R.E. Code Review Report

            **审查强度**: Level ${{ steps.scope.outputs.review_level }}
            **审查模式**: ${{ steps.scope.outputs.review_mode }}
            **安全敏感变更**: ${{ steps.scope.outputs.is_security_sensitive == 'true' && '是' || '否' }}

            <!-- 实际结果从 review_result.json 解析 -->

            ---
            *由 D.A.R.E. 框架自动生成的对抗性代码审查*
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: reviewBody
            });

      - name: Gate check - Block merge on Critical
        if: steps.scope.outputs.is_security_sensitive == 'true'
        run: |
          echo "安全敏感文件变更，强制严格审查"
          # 实际应根据review_result.json中的blocker_count判断
          # if [ "$BLOCKER_COUNT" -gt 0 ]; then
          #   exit 1
          # fi
```

### 2. 合并前快速扫描 (Lv.2)

```yaml
# .github/workflows/dare-code-pre-merge.yml
name: D.A.R.E. Pre-Merge Scan

on:
  pull_request:
    types: [ready_for_review]
    branches:
      - main
      - master
      - release/**

jobs:
  pre-merge-scan:
    name: Pre-Merge Quick Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Devil-Maint Quick Scan
        id: quick_scan
        run: |
          echo "执行Lv.2快速扫描..."
          # 调用审查服务，mode=single, role=Devil-Maint, level=2
          echo "scan_complete=true" >> $GITHUB_OUTPUT

      - name: Check gate condition
        run: |
          # Lv.2阻塞条件: Critical > 0
          echo "检查Gate条件..."
          # if [ "$CRITICAL_COUNT" -gt 0 ]; then exit 1; fi
```

### 3. 安全文件变更高等级审查 (Lv.4)

```yaml
# .github/workflows/dare-code-security.yml
name: D.A.R.E. Security Hardening Review

on:
  pull_request:
    paths:
      - '**/auth/**'
      - '**/security/**'
      - '**/crypto/**'
      - '**/password/**'
      - '**/token/**'
      - '**/permission/**'
      - '**/*.key'
      - '**/*.pem'
      - '**/*.crt'
      - '**/*secret*'
      - '**/*credential*'

jobs:
  security-review:
    name: Security Hardening Review (Lv.4)
    runs-on: ubuntu-latest
    environment: security-review  # 可添加环境保护规则

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Full Council Review
        id: council_review
        run: |
          echo "执行Lv.4多Agent委员会审查..."
          echo "mode=council" >> $GITHUB_OUTPUT
          echo "level=4" >> $GITHUB_OUTPUT
          echo "agents=Devil-Code,Devil-Sec,Devil-Maint" >> $GITHUB_OUTPUT

      - name: Security Gate
        run: |
          # Lv.4阻塞条件: High > 0
          echo "安全Gate检查: High问题必须为0"
          # if [ "$HIGH_COUNT" -gt 0 ]; then
          #   echo "发现High级别安全问题，阻塞合并"
          #   exit 1
          # fi

      - name: Notify security team
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '@security-team 安全审查发现High级别问题，需要人工介入审查。'
            });
```

### 4. 夜间批量扫描 (Lv.2)

```yaml
# .github/workflows/dare-code-nightly.yml
name: D.A.R.E. Nightly Batch Scan

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch:  # 支持手动触发

jobs:
  nightly-scan:
    name: Nightly Full Codebase Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Full codebase scan
        run: |
          echo "执行全量代码库Lv.2扫描..."
          # 自对抗模式: Agent审查自己的输出
          echo "mode=self_adversarial" >> $GITHUB_OUTPUT
          echo "level=2" >> $GITHUB_OUTPUT

      - name: Upload scan report
        uses: actions/upload-artifact@v4
        with:
          name: nightly-scan-report
          path: scan-report.json

      - name: Create issue for new findings
        uses: actions/github-script@v7
        with:
          script: |
            // 如发现新问题，创建跟踪issue
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '[DARE-Nightly] 发现新安全问题',
              body: '夜间扫描发现需要关注的问题，详见附件报告。',
              labels: ['security', 'dare-scan', 'automated']
            });
```

## 高级配置

### 多语言项目配置

```yaml
# 在job步骤中根据文件扩展名选择审查参数
- name: Detect languages
  id: languages
  run: |
    CHANGED_FILES="${{ steps.scope.outputs.changed_files }}"
    LANGUAGES=""
    
    if echo "$CHANGED_FILES" | grep -q '\.py$'; then LANGUAGES="$LANGUAGES python"; fi
    if echo "$CHANGED_FILES" | grep -q '\.js$\|\.ts$'; then LANGUAGES="$LANGUAGES javascript typescript"; fi
    if echo "$CHANGED_FILES" | grep -q '\.java$'; then LANGUAGES="$LANGUAGES java"; fi
    if echo "$CHANGED_FILES" | grep -q '\.go$'; then LANGUAGES="$LANGUAGES go"; fi
    
    echo "languages=$LANGUAGES" >> $GITHUB_OUTPUT
```

### 增量审查配置

```yaml
# 只审查变更的行，而非整个文件
- name: Generate line-level diff
  run: |
    git diff -U0 origin/${{ github.base_ref }}...HEAD > diff-context.txt
    # 提取变更行号范围，用于精确定位问题
    grep -E '^@@' diff-context.txt > line-ranges.txt
```

### 与现有工具集成

```yaml
# 与SonarQube/ESLint等现有工具集成
- name: Run existing linters
  run: |
    npm run lint -- --format json > eslint-report.json || true
    # 将现有工具结果作为上下文传递给DARE Agent

- name: DARE Review with context
  run: |
    cat > review_payload.json << EOF
    {
      "existing_reports": {
        "eslint": "$(cat eslint-report.json | base64 -w 0)"
      }
    }
    EOF
```

## 必需 Secrets 配置

| Secret名称 | 说明 | 必需 |
|-----------|------|------|
| `OPENAI_API_KEY` | OpenAI API密钥 | 是（如使用GPT模型） |
| `ANTHROPIC_API_KEY` | Anthropic API密钥 | 否（备用） |
| `DARE_API_URL` | 自定义DARE服务地址 | 否 |
| `GITHUB_TOKEN` | 自动提供，用于评论 | 自动 |

## 环境变量配置

```yaml
env:
  DARE_REVIEW_LEVEL: '3'           # 默认审查强度
  DARE_BLOCK_ON_CRITICAL: 'true'   # Critical问题阻塞合并
  DARE_BLOCK_ON_HIGH_THRESHOLD: '3' # High问题阈值
  DARE_MIN_SECURITY_SCORE: '70'    # 最小安全评分
  DARE_MAX_DIFF_SIZE: '50000'      # 最大diff大小（字节）
  DARE_TIMEOUT_SECONDS: '300'      # 审查超时时间
```
