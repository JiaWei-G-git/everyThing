---
name: sdlc-frontend
description: Execute Stage 7 (Frontend Coding) of the SDLC pipeline. Generate frontend code scaffolding (routing, pages, components, services) based on wireframe, UI design, and API contract. Code is engineering scaffolding, not production-ready. Trigger when tech architecture is confirmed or user asks for frontend code. Keywords: '前端开发', '前端代码', 'frontend', 'React', 'Vue', '页面实现', 'component'.
---

# SDLC Frontend Coding Stage 7

## Purpose
Generate frontend engineering scaffolding — project structure, routing, page components, shared components, and API service wrappers. This is scaffolding, not production code.

## Input
- `artifacts/04-wireframe/v{N}/wireframe.md`
- `artifacts/05-ui-design/v{N}/ui-design.md`
- `artifacts/06-tech-arch/v{N}/tech-arch.md`
- `artifacts/api-contract.yaml` (READ-ONLY cross-stage contract)
- `project-config.yaml` (tech stack, component library)

## Output
- `artifacts/07-frontend/` directory with code files

## Workflow

### Step 1: Read Tech Stack & Contract
1. Read `project-config.yaml` for frontend stack (React/Vue/Angular, UI library, build tool)
2. Read `api-contract.yaml` — extract all endpoints for this frontend
3. Read `wireframe.md` for page list and navigation structure
4. Read `ui-design.md` for design tokens and component specs

### Step 2: Generate Project Structure
Create directory structure based on tech stack:
```
artifacts/07-frontend/
├── src/
│   ├── pages/           # Page components per wireframe
│   ├── components/      # Shared components (Table, Form, Search, etc.)
│   ├── services/        # API service wrappers (one per API tag)
│   ├── hooks/           # Shared hooks (if React)
│   ├── utils/           # Utility functions (pagination, format, auth)
│   ├── router/          # Route configuration
│   ├── stores/          # State management (if needed)
│   └── styles/          # Global CSS, design tokens
├── public/
├── package.json
├── vite.config.js / webpack.config.js
└── README.md
```

For large projects (>50 pages), split into `src/modules/{module}/pages/`.

### Step 3: Generate Code Files
For each file, generate scaffolding with:
- **Routing**: route config with lazy loading, auth guards, page components
- **Page Components**: component skeleton with imports, layout structure, state placeholders, lifecycle hooks
- **Shared Components**: Table (with pagination, selection, action column), Form (with validation), SearchBar, Pagination
- **API Services**: one service file per API tag, all endpoints with request/response types, using axios/fetch
- **Utils**: auth token management, request interceptor, response handler, pagination helper, date formatter
- **Design Tokens**: CSS variables or theme config matching `ui-design.md`

**Code Scaffolding Rules**:
- Include all imports and type definitions
- Include TODO comments where business logic needs to be filled
- Include placeholder data for development testing
- Do NOT include complex business logic — only CRUD scaffolding
- Use the component library specified in config (Element Plus, Ant Design, etc.)
- Data authority controls: route guards + button-level permission checks (framework only, rules to be filled)

### Step 4: Hallucination Defense
1. After code generation, run `npm install` (if node available) or verify dependencies in package.json
2. Check all imported dependencies exist in npm registry (top 100 libraries are safe; exotic ones need verification)
3. Check component names match the UI library API (e.g., `ElTable` for Element Plus, `ATable` for Ant Design)
4. Run lint check if available: `npm run lint` or `eslint`

### Step 5: Consistency Check
Run `scripts/check-api-contract.py` (frontend mode):
- Scan all service calls in frontend code
- Verify every called API exists in `api-contract.yaml`
- Report missing or fictional API calls
- Report route conflicts (duplicate paths)

### Step 6: Write Output
Write all files to `artifacts/07-frontend/`

### Step 7: Gate Review
Present: "前端代码已生成（工程骨架），请确认项目结构是否合理？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 8
- User changes: Update specific files, re-run checks

## Gate Checklist
- [ ] All pages from wireframe have corresponding components (auto-check: compare lists)
- [ ] All API calls match backend contract (auto-check: scan vs api-contract.yaml)
- [ ] Route guards framework is in place (manual check: auth guard exists)
- [ ] Package dependencies can be resolved (auto-check: verify package.json)
- [ ] No obvious lint errors (auto-check: syntax scan)
- [ ] User confirms page structure

## References
- `references/frontend-scaffold-{react,vue,angular}.md` — framework-specific patterns
- `references/api-client-patterns.md` — axios/fetch wrapper patterns
- `references/permission-frontend.md` — route guard and button-level permission implementation

## Important Notes
- Output is **scaffolding**, not production code. Business logic is TODO-marked for human completion.
- For South Grid projects, the org hierarchy data authority filter is implemented as a framework (interceptors/hooks) with TODO for the actual filtering logic.
- Do not generate CSS pixel-perfect designs. Use the UI library's default theme + design tokens.
