---
name: sdlc-prd
description: Execute Stage 3 (PRD) of the SDLC pipeline. Generate a structured Product Requirements Document with requirement IDs, traceability matrix, and support for template learning from existing documents. Trigger when discovery/review is confirmed or user asks to write PRD. Keywords: 'PRD', '产品需求', '需求文档', '写PRD', '需求规格', '功能设计'.
---

# SDLC PRD Stage 3

## Purpose
Generate a structured PRD with requirement IDs, data entities, permission matrix, and interface overview. Support template learning from uploaded documents.

## Input
- `artifacts/01-discovery/v{N}/discovery.md`
- `artifacts/02-review/v{N}/review.md` (optional, if review skipped)
- `project-config.yaml` (tech stack preferences, optional)
- `style-guide.md` (learned format standards, optional)

## Output
- `artifacts/03-prd/draft/prd.md` (structured PRD)
- `artifacts/03-prd/draft/rtm-initial.md` (initial traceability matrix)

## Workflow

### Step 1: Load Inputs & Style Guide
1. Read discovery and review reports
2. Check for `style-guide.md` (learned from previous PRD samples). If exists, follow its format.
3. If no style guide, use default PRD template from `references/prd-template.md`

### Step 2: Requirement ID Assignment
1. For each functional module and requirement, assign a unique REQ-ID:
   - Format: `REQ-{module}-{seq}` (e.g., `REQ-USER-001`)
   - Modules: USER, ROLE, METER, DATA, REPORT, etc. (derive from domain)
2. Record all REQ-IDs in a temporary list for RTM generation

### Step 3: Generate PRD
Write `prd.md` with these sections:
1. **Product Overview** (definition, users, value proposition, scope)
2. **Functional Modules** (module list + detailed feature points, each with REQ-ID)
3. **Data Entities** (preliminary data models, each with REQ-ID reference)
4. **Permission Matrix** (role × page × operation, with REQ-ID reference)
5. **Interface Overview** (high-level API list, not detailed spec, with REQ-ID reference)
6. **Non-Functional Requirements** (performance, security, compliance)
7. **Appendix** (version history, dependency notes)

### Step 4: Generate Initial RTM
Write `rtm-initial.md` with columns:
| REQ-ID | Description | Prototype Page | DB Table | API | Frontend Page | Test Case | Status |
Initially, only REQ-ID and Description are filled. Other columns will be filled by downstream stages.

### Step 5: Write Output Files
Write both files to `artifacts/03-prd/draft/`

### Step 6: Gate Review
Present: "PRD 已生成，请确认是否满足需求？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 4
- User changes: Update draft, ask again

## Gate Checklist
- [ ] All features assigned REQ-ID (auto-check: scan for ID coverage)
- [ ] All functional modules from discovery are covered (auto-check: compare lists)
- [ ] Data entities defined clearly
- [ ] Permission matrix covers all roles from discovery
- [ ] User confirms no missing features

## References
- `references/prd-template.md` — default PRD structure
- `references/req-id-rules.md` — REQ-ID naming conventions
- `references/nfr-checklist.md` — non-functional requirements for South Grid projects

## Template Learning
If user uploads existing PRD/sample documents:
1. Analyze structure: chapter order, heading levels, table styles
2. Extract naming conventions and field definitions
3. Write extracted standards to `style-guide.md`
4. Use `style-guide.md` for all subsequent PRD generation
