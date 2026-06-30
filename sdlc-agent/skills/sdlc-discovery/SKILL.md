---
name: sdlc-discovery
description: Execute Stage 1 (Discovery) of the SDLC pipeline. Conduct structured interviews to clarify project requirements, match domain templates, and output a standardized discovery report. Trigger when the user wants to start a new project, gather requirements, or begin the SDLC discovery phase. Keywords: 'discovery', '需求访谈', '开始项目', '需求发现', '需求澄清', '启动项目'.
---

# SDLC Discovery Stage 1

## Purpose
Clarify user requirements through structured interviews, match domain templates, and produce a standardized discovery report.

## Input
- Project description (one sentence or detailed description) from user
- Optional: existing documents the user uploads for context

## Output
- `artifacts/01-discovery/draft/discovery.md` (standardized Markdown report)

## Workflow

### Step 1: Domain Template Matching
1. Read `knowledge-base/domain-templates/` to find matching domain
2. Match keywords from project description to domain folders:
   - energy-metering → 南网/计量/电能量/采集
   - general-admin → 后台管理/系统管理/通用
3. If match found, load domain-specific questions from `references/domain-questions.md`
4. If no match, use `references/general-questions.md`

### Step 2: Structured Interview
1. Ask the user one question at a time (max 3-5 per conversation)
2. Do not overwhelm with all questions at once
3. Cover these areas:
   - Business background & stakeholders
   - Core goals & success metrics
   - User roles & permissions
   - Key data entities & workflows
   - Constraints (technical, regulatory, timeline)
   - Integration with existing systems
4. Use domain-specific questions when available

### Step 3: Report Generation
1. Generate `discovery.md` with sections:
   - Business Background
   - Current Status
   - Core Goals (numbered list)
   - User Roles & Responsibilities
   - Key Data Entities (preliminary list)
   - Key Workflows (preliminary list)
   - Constraints & Assumptions
   - Risk Register (initial)
   - Next Steps
2. Write to `artifacts/01-discovery/draft/discovery.md`

### Step 4: Gate Review
Present the report to user. Ask: "确认此报告无误？如需修改请指出，回复 Y 继续。"

- If user says Y or 确认: Move file to `artifacts/01-discovery/v1/` (create directory + copy), then proceed to Stage 2 or stop per user request
- If user requests changes: Update `draft/discovery.md`, ask again

## Gate Checklist
- [ ] Business background is clear
- [ ] Core goals are measurable and ≤ 5 items
- [ ] Key constraints identified
- [ ] User confirms no missing requirements

## References
- `references/domain-questions.md` — domain-specific interview questions
- `references/general-questions.md` — generic backend admin system questions
- `references/report-template.md` — discovery report format template

## Notes
- Keep interviews conversational. Ask follow-up questions based on previous answers.
- Do not invent requirements. If unclear, ask the user to clarify.
- For South Grid (南网) projects, always ask about data authority levels (省/地市/区县/班组/供电所).
