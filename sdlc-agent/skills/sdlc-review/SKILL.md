---
name: sdlc-review
description: Execute Stage 2 (Review) of the SDLC pipeline. Review the discovery report for feasibility, scope alignment, and risk assessment. Trigger after Stage 1 discovery is confirmed or when the user explicitly asks to review requirements. Keywords: 'review', '需求评审', '可行性分析', '评估需求', '范围确认'.
---

# SDLC Review Stage 2

## Purpose
Review the discovery report for feasibility, confirm scope alignment, and identify risks before proceeding to PRD.

## Input
- `artifacts/01-discovery/v{N}/discovery.md` (latest confirmed discovery)

## Output
- `artifacts/02-review/draft/review.md` (review report with feasibility conclusion)

## Workflow

### Step 1: Read Discovery Report
1. Read the latest confirmed discovery report from `artifacts/01-discovery/v{N}/`
2. If no confirmed version exists, error — user must complete Stage 1 first

### Step 2: Feasibility Assessment
Generate review covering:
1. **Scope Alignment Check**: Does the discovery scope match business goals? Flag scope creep or omissions.
2. **Technical Feasibility**: Can this be built with reasonable technology? Flag high-risk integrations or unknowns.
3. **Regulatory/Compliance Check**: For South Grid (南网) projects, check if any compliance requirements are mentioned (e.g., 等保, 国产化, 数据安全).
4. **Risk Assessment**: Assign risk levels (High/Medium/Low) to each identified risk.
5. **Recommendations**: Go/No-Go decision with conditions.

### Step 3: Write Review Report
Generate `review.md` with sections:
- Executive Summary (Go/No-Go + conditions)
- Scope Alignment Assessment
- Technical Feasibility Assessment
- Risk Register (expanded from discovery)
- Assumptions & Dependencies
- Recommendations

Write to `artifacts/02-review/draft/review.md`.

### Step 4: Gate Review
Present to user: "评审完成，请确认是否继续进入 PRD 阶段？回复 Y 继续，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 3
- User requests changes: Update draft, ask again

## Gate Checklist
- [ ] Scope aligns with business goals
- [ ] Technical feasibility assessed
- [ ] Key risks identified and rated
- [ ] User confirms Go/No-Go decision

## References
- `references/risk-matrix.md` — risk assessment criteria
- `references/feasibility-checklist.md` — technical feasibility questions
