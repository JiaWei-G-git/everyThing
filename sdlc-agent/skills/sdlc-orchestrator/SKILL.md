---
name: sdlc-orchestrator
description: Master orchestrator for the SDLC pipeline. Manages project initialization, stage scheduling, gate reviews, state tracking, and requirement change handling. Can run any stage independently or the full pipeline. Trigger when user starts a project, continues a stage, or requests any SDLC action. Keywords: 'SDLC', 'pipeline', 'start project', '继续', 'next stage', 'stage', '流程', '启动项目', '开始开发', '需求变更'.
---

# SDLC Orchestrator

## Purpose
Coordinate all SDLC stages, manage project state, handle gate reviews, and process requirement changes. This is the entry point for all SDLC operations.

## Commands

### Command: Start Project
**Trigger**: User says "启动项目 [项目名]" or "start project [name]"

**Actions**:
1. Create project directory: `projects/[project-id]/`
2. Create `project-config.yaml` from user input (ask for tech stack if not provided)
3. Create `artifacts/` structure with all stage subdirectories and `draft/` folders
4. Create `memory/` directory
5. Initialize `sdlc.log` with project creation record
6. Search `knowledge-base/` for reusable experience matching the domain and tech stack
7. If found, present recommendations to user ("发现类似项目经验，是否应用？")
8. If user uploads sample documents, trigger `sdlc-prd` template learning first
9. Set current stage to `discovery`, current version to 1
10. Trigger `sdlc-discovery` skill

### Command: Continue / Next Stage
**Trigger**: User says "继续", "Y", "next", "下一阶段"

**Actions**:
1. Read `sdlc.log` to find current stage and status
2. Check if current stage has a confirmed version in `artifacts/XX-stage/v{N}/`
3. If yes → determine next stage and trigger it
4. If no → prompt user to complete current stage first

**Stage sequence**: discovery → review → prd → wireframe → ui-design → tech-arch → frontend → backend → test

### Command: Run Specific Stage
**Trigger**: User says "从 [stage] 开始" or "run [stage]" or "只跑 [stage]"

**Actions**:
1. Parse the requested stage name
2. Check if prerequisite artifacts exist (refer to each skill's Input section)
3. If prerequisites missing → ask user to provide minimum input or run preceding stages
4. If prerequisites satisfied → trigger the requested skill
5. After completion, do NOT auto-advance to next stage (user explicitly requested single stage)

### Command: Modify Requirement / Change
**Trigger**: User says "需求变更 [description]" or "修改 [内容]"

**Actions**:
1. Read current `traceability-matrix.md` (RTM)
2. Analyze the change description and identify affected REQ-IDs
3. Use RTM to identify downstream artifacts potentially affected:
   - For each affected REQ-ID, list: related pages, tables, APIs, test cases
4. Present impact analysis to user:
   ```
   变更影响范围：
   - 需求：REQ-001, REQ-003
   - 原型页面：用户列表（需增加手机号列）
   - 数据库表：sys_user（需增加 phone 字段）
   - API 接口：API-002（请求参数变更）
   - 前端：用户列表页面
   - 测试：TC-001（需增加字段验证）
   ```
5. Ask user: "请确认需要更新的模块（勾选）：[ ] PRD [ ] 原型 [ ] 数据库 [ ] API [ ] 前端 [ ] 后端 [ ] 测试"
6. User confirms → update affected modules' `draft/` files, increment version numbers
7. User skips some → record skipped items as known risks in `sdlc.log`
8. After updates, user can "继续" to review and confirm new versions

### Command: View Progress / Status
**Trigger**: User says "查看进度", "状态", "progress"

**Actions**:
1. Read `sdlc.log`
2. Display current stage, version, and status for all stages:
   ```
   项目：南网计量系统-v2
   当前阶段：技术架构 (Stage 6)
   状态：等待审核
   
   阶段进度：
   [✓] 01 需求发现    v1 (已确认)
   [✓] 02 需求评审    v1 (已确认)
   [✓] 03 PRD         v1 (已确认)
   [✓] 04 原型设计    v1 (已确认)
   [✓] 05 UI设计     v1 (已确认)
   [→] 06 技术架构    v1 (draft 待审核)
   [ ] 07 前端编码    —
   [ ] 08 后端编码    —
   [ ] 09 测试验证    —
   ```

### Command: View Experience / Knowledge
**Trigger**: User says "查看经验", "查看历史", "查看知识库"

**Actions**:
1. Read `knowledge-base/project-index.json`
2. List all archived projects with domain and tech stack
3. Search `memory/` for relevant notes, decisions, pitfalls
4. Present to user in a readable format

### Command: Upload Template
**Trigger**: User says "上传模板" or provides file references

**Actions**:
1. Read the uploaded document(s)
2. Analyze structure, format, naming conventions, chapter patterns
3. Extract style standards
4. Write to `style-guide.md` in the project root
5. Notify: "模板已学习，后续 PRD 将按此风格生成。"

## State Management

### `sdlc.log` Format
```yaml
project_id: "南网计量系统-v2"
created_at: "2025-06-29T10:00:00Z"
current_stage: "tech-arch"
current_version: 1
stages:
  discovery:
    status: "confirmed"
    version: 1
    path: "artifacts/01-discovery/v1/discovery.md"
  review:
    status: "confirmed"
    version: 1
    path: "artifacts/02-review/v1/review.md"
  prd:
    status: "confirmed"
    version: 1
    path: "artifacts/03-prd/v1/prd.md"
  wireframe:
    status: "confirmed"
    version: 1
    path: "artifacts/04-wireframe/v1/wireframe.md"
  ui-design:
    status: "confirmed"
    version: 1
    path: "artifacts/05-ui-design/v1/ui-design.md"
  tech-arch:
    status: "pending_review"
    version: 1
    path: "artifacts/06-tech-arch/draft/tech-arch.md"
  frontend:
    status: "not_started"
  backend:
    status: "not_started"
  test:
    status: "not_started"
changes:
  - date: "2025-06-29T14:00:00Z"
    description: "需求变更：用户管理增加手机号字段"
    affected_reqs: ["REQ-USER-001"]
    updated_stages: ["prd", "wireframe", "tech-arch"]
```

### Project Directory Template
```
projects/{project-id}/
├── project-config.yaml
├── style-guide.md (optional, from template learning)
├── sdlc.log
├── artifacts/
│   ├── 01-discovery/
│   │   ├── draft/
│   │   └── v1/ (confirmed)
│   ├── 02-review/
│   ├── 03-prd/
│   ├── 04-wireframe/
│   ├── 05-ui-design/
│   ├── 06-tech-arch/
│   ├── 07-frontend/
│   ├── 08-backend/
│   ├── 09-test/
│   ├── api-contract.yaml (cross-stage, not versioned)
│   └── traceability-matrix.md (cross-stage, updated by all stages)
└── memory/
    ├── tech-notes.md
    ├── design-decisions.md
    └── lessons-learned.md
```

## Gate Review Handling
When any stage completes its `draft/` output, the orchestrator must:
1. Present the gate review prompt (from the stage's SKILL.md)
2. Wait for user response
3. On confirm (Y): move `draft/` → `v{N}/` (create dir, copy files), update `sdlc.log`
4. On reject/modify: keep in `draft/`, update with user feedback, re-run stage checks
5. On "direct edit": user edits file directly, then says "done" → orchestrator verifies file exists and moves to `v{N}/`

## Knowledge Base Integration
When a project completes (or user explicitly requests):
1. Extract reusable knowledge from `memory/` (tech stack choice, pitfalls, design decisions, conventions)
2. Write to `knowledge-base/project-index.json` (append project entry)
3. Write structured memory to `knowledge-base/best-practices/` or domain-specific folders
4. Index by tags (domain, tech stack, keywords) for future retrieval

## Sub-Module Invocation
When user says "只生成数据库设计" or "只生成用户管理页面" → the orchestrator should:
1. Parse the sub-module request
2. Determine the parent stage (e.g., "数据库设计" → backend stage)
3. Load the parent stage's SKILL.md
4. Extract the sub-module specific instructions from the SKILL.md
5. Trigger the generation with narrowed scope

## Error Handling
- Missing prerequisite artifact → ask user to run preceding stage or provide manual input
- File read/write failure → report error, suggest manual operation
- Unknown command → present available commands

## References
- `references/command-patterns.md` — all supported user command patterns
- `references/orchestrator-state.md` — detailed state machine documentation
- `references/change-impact-analysis.md` — requirement change impact analysis logic
