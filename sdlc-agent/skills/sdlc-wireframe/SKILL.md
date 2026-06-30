---
name: sdlc-wireframe
description: Execute Stage 4 (Wireframe) of the SDLC pipeline. Generate a page structure list and low-fidelity HTML prototype from the PRD. Output serves as reference for Axure implementation. Trigger when PRD is confirmed or user asks for wireframe/prototype. Keywords: 'wireframe', '原型', '页面设计', '交互原型', '低保真', 'page structure'.
---

# SDLC Wireframe Stage 4

## Purpose
Generate a structured page list and low-fidelity HTML prototype from the PRD. Output is a reference for Axure implementation, not a replacement.

## Input
- `artifacts/03-prd/v{N}/prd.md`
- `artifacts/03-prd/v{N}/rtm-initial.md`

## Output
- `artifacts/04-wireframe/draft/wireframe.md` (page structure list)
- `artifacts/04-wireframe/draft/prototype.html` (low-fidelity clickable HTML)

## Workflow

### Step 1: Extract Pages from PRD
1. Read PRD and RTM
2. For each functional module and feature point, identify required pages:
   - List page → for CRUD operations
   - Form page → for create/edit
   - Detail page → for viewing single record
   - Dashboard → for overview/statistics
3. Assign each page a route path based on naming conventions

### Step 2: Generate Page Structure List
Write `wireframe.md` with table for each page:

| Field | Content |
|-------|---------|
| Page Name | e.g., "用户管理" |
| Route | e.g., `/system/user` |
| Page Type | 列表页 / 表单页 / 详情页 / 仪表盘 |
| Core Components | Table, SearchBar, ActionButtons, Pagination |
| Data Source | API endpoint reference |
| Operations | create, read, update, delete, export, batch |
| Role Permissions | admin: all, manager: read+update |
| Interaction Rules | "Click edit → open drawer form", "Batch delete → confirm dialog" |
| Related Pages | Links to parent/child pages |
| REQ-ID | REQ-USER-001, REQ-USER-002 |

Also include:
- Navigation menu structure (tree)
- Page-to-page flow diagrams (text description)
- Global components (header, sidebar, footer)

### Step 3: Generate Low-Fidelity HTML
Write `prototype.html` with:
1. Simple HTML structure using divs and basic CSS
2. No real styling, only layout structure (grids, flexbox)
3. Clickable navigation between pages (anchor links or simple JS)
4. Placeholder text for all fields and buttons
5. Responsive layout hints (desktop-first)

The HTML is a **layout reference only**, not production code.

### Step 4: Auto-Check Coverage
Run script: `scripts/check-wireframe-coverage.py`
- Compares PRD feature list vs wireframe page list
- Reports missing pages or uncovered features
- Fails gate if coverage < 95%

### Step 5: Write Output
Write both files to `artifacts/04-wireframe/draft/`

### Step 6: Gate Review
Present: "原型设计已生成，请确认页面结构是否完整？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 5
- User changes: Update draft, re-run coverage check

## Gate Checklist
- [ ] All PRD features have at least one corresponding page (auto-check)
- [ ] Page routes have no conflicts (auto-check: scan for duplicate routes)
- [ ] Permission control is reflected in page structure (auto-check: compare with PRD matrix)
- [ ] User confirms interaction rules are clear

## References
- `references/page-type-patterns.md` — common page patterns for admin systems
- `references/route-conventions.md` — URL naming conventions
- `references/prototype-template.html` — HTML scaffold template

## Notes
- For South Grid projects, always include data authority level indicators (省/地市/区县) in permission fields.
- Page structure list is the primary output; HTML is secondary reference.
- If user says "用 Axure 做原型" → provide the page structure list for Axure reference, not HTML.
