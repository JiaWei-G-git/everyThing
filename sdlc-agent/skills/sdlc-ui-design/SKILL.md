---
name: sdlc-ui-design
description: Execute Stage 5 (UI Design) of the SDLC pipeline. Generate design tokens (color, typography, spacing) and component usage specifications for the project. Output is ready for code generation. Trigger when wireframe is confirmed or user asks for UI design/design system. Keywords: 'UI设计', '设计规范', 'design tokens', '组件规范', '视觉规范', '设计系统'.
---

# SDLC UI Design Stage 5

## Purpose
Generate design tokens (colors, typography, spacing) and component usage specifications. Output is code-ready for the frontend generation stage.

## Input
- `artifacts/03-prd/v{N}/prd.md` (for product style reference)
- `artifacts/04-wireframe/v{N}/wireframe.md` (for component needs)
- `project-config.yaml` (for component library preference, e.g., Element Plus, Ant Design)

## Output
- `artifacts/05-ui-design/draft/ui-design.md` (design system document)

## Workflow

### Step 1: Determine Component Library
1. Read `project-config.yaml` for `ui_component_library` (e.g., Element Plus, Ant Design, Naive UI)
2. If specified, load `references/{library}-tokens.md` for default token values
3. If not specified, use generic admin system tokens from `references/default-tokens.md`

### Step 2: Generate Design Tokens
Write `ui-design.md` with sections:

#### 2.1 Color System
- Primary: main action color
- Secondary: accent/secondary actions
- Success, Warning, Error, Info: semantic colors
- Neutral: text, borders, backgrounds (grayscale scale)
- For South Grid: consider enterprise blue/gray tones; avoid flashy colors

#### 2.2 Typography
- Font family (default system fonts for Chinese)
- Size scale: 12px, 14px, 16px, 18px, 20px, 24px
- Weight: normal, medium, bold
- Line height: 1.5 for body, 1.2 for headings

#### 2.3 Spacing System
- Grid: 8px base unit (8, 16, 24, 32, 40, 48, 64)
- Page margins, card padding, form gaps
- Table cell padding, button padding

#### 2.4 Component Specifications
For each component type used in wireframe:
- **Button**: sizes (small/medium/large), types (primary/default/danger/text), states (hover/active/disabled)
- **Table**: header style, row hover, selection, action column alignment, pagination position
- **Form**: label alignment (right/top), field width, inline vs vertical layout, validation style
- **Dialog/Modal**: width presets, mask style, animation notes
- **Drawer**: width presets, header/footer, scroll behavior
- **Pagination**: page sizes, total display, jumper
- **Input/Select**: sizes, states, error display
- **DatePicker/Tree/Cascader**: common patterns
- **Message/Notification**: placement, duration

Each component spec includes:
- Visual description (reference component library defaults)
- Usage rules (when to use which variant)
- Code-ready values (CSS variables or design tokens)

### Step 3: Write Output
Write to `artifacts/05-ui-design/draft/ui-design.md`

### Step 4: Gate Review
Present: "UI 设计规范已生成，请确认设计令牌和组件规范是否满足需求？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 6
- User changes: Update draft, ask again

## Gate Checklist
- [ ] Color system covers all semantic states (primary, success, warning, error, info, neutral)
- [ ] Typography hierarchy meets admin system needs (heading, body, auxiliary, code)
- [ ] Table component spec fits data-intensive scenarios (compact rows, action column right-aligned)
- [ ] Form component spec supports complex inputs (date, select, cascade, multi-select)
- [ ] User confirms design tokens for South Grid style

## References
- `references/default-tokens.md` — generic admin system design tokens
- `references/element-plus-tokens.md` — Element Plus specific tokens
- `references/ant-design-tokens.md` — Ant Design specific tokens
- `references/south-grid-style.md` — South Grid visual style preferences

## Notes
- Design tokens are output as CSS variables for direct use in code generation.
- Do not generate pixel-perfect visual designs. Focus on token values and component rules.
- For South Grid enterprise systems, prefer muted professional color schemes over vibrant consumer styles.
