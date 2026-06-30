---
name: sdlc-tech-arch
description: Execute Stage 6 (Technical Architecture) of the SDLC pipeline. Design system architecture, database schema, and generate the API contract file that downstream stages consume. Trigger when UI design is confirmed or user asks for architecture/tech design. Keywords: '架构设计', '技术架构', '数据库设计', 'API设计', '技术选型', 'system architecture'.
---

# SDLC Tech Architecture Stage 6

## Purpose
Design system architecture, database schema, and generate `api-contract.yaml` — the cross-stage contract consumed by frontend, backend, and test stages.

## Input
- `artifacts/03-prd/v{N}/prd.md`
- `artifacts/03-prd/v{N}/rtm-initial.md`
- `project-config.yaml` (tech stack, must be specified)

## Output
- `artifacts/06-tech-arch/draft/tech-arch.md` (architecture document)
- `artifacts/06-tech-arch/draft/db-design.md` (database design)
- `artifacts/api-contract.yaml` (cross-stage contract, placed at project root of artifacts)

## Workflow

### Step 1: Read Tech Stack from Config
1. Read `project-config.yaml`
2. Extract tech stack: frontend, backend, database, UI library, build tool
3. If tech stack is incomplete, ask user to confirm or fill missing items
4. Validate tech stack reasonableness (e.g., South Grid projects may need 国产化/信创 considerations)

### Step 2: Generate System Architecture
Write `tech-arch.md` with:
1. **Technology Stack** (confirmed choices + rationale)
2. **System Architecture Diagram** (text description + layer explanation)
   - Presentation layer
   - API Gateway layer
   - Business Logic layer
   - Data Access layer
   - Database layer
3. **Module Division** (by business domain)
4. **Technology Rationale** (why this stack for this project)
5. **Deployment Architecture** (high-level, not detailed CI/CD)
6. **Security Considerations** (authentication, authorization, data protection)
7. **Performance Considerations** (caching, pagination, async processing)

### Step 3: Generate Database Design
Write `db-design.md` with:
1. **ER Diagram Description** (text-based, entities and relationships)
2. **Table Definitions** (one per entity, with fields, types, constraints, indexes)
   - Each table must reference associated REQ-ID(s)
   - Include standard admin tables: users, roles, permissions, operation logs
   - For South Grid: include organization hierarchy (org tree) for data authority
3. **Naming Conventions** (table names, column names, index names)
4. **Data Authority Model** (org hierarchy table for row-level filtering)

### Step 4: Generate API Contract (CRITICAL)
Write `api-contract.yaml` with structure:

```yaml
api_contract:
  version: "v1"
  base_path: "/api/v1"
  standards:
    - response: { code: int, message: string, data: object, timestamp: long }
    - pagination: { page: int, size: int, total: int, data: [], totalPages: int }
  endpoints:
    - id: "API-001"
      path: "/users"
      method: "GET"
      tags: ["USER"]
      summary: "Query user list"
      request:
        query: { page: int, size: int, keyword: string, org_id: long }
      response:
        data: { items: [], total: int }
      related_req: ["REQ-USER-001"]
      related_page: ["用户列表"]
      related_table: ["sys_user"]
      
    - id: "API-002"
      path: "/users/{id}"
      method: "PUT"
      tags: ["USER"]
      summary: "Update user"
      request:
        path: { id: long }
        body: { username: string, role_ids: [], org_id: long, phone: string }
      response:
        data: { success: boolean }
      related_req: ["REQ-USER-001"]
```

**Rules for API Contract**:
- Every API endpoint must have a unique `API-{seq}` ID
- Every endpoint must reference `related_req`, `related_page`, `related_table`
- Use RESTful conventions
- Include standard pagination wrapper
- Include standard response wrapper
- Do not invent endpoints not referenced in PRD

**Write `api-contract.yaml` to `artifacts/api-contract.yaml`** (project-level, not versioned per stage)

### Step 5: Auto-Checks
Run `scripts/check-db-coverage.py`: compare PRD data entities vs DB tables, report missing
Run `scripts/check-api-coverage.py`: compare PRD interface overview vs API endpoints, report missing

### Step 6: Write Output
Write architecture and DB design to `artifacts/06-tech-arch/draft/`
Write API contract to `artifacts/api-contract.yaml` (overwrite if exists, but preserve downstream annotations)

### Step 7: Gate Review
Present: "技术架构已生成，包括 API 契约文件。请确认是否满足需求？回复 Y 确认，或提出修改意见。"

- User confirms: Move arch to `v1/`, proceed to Stage 7 (note: API contract is not versioned per stage, it's a living contract)
- User changes: Update draft, re-run checks

## Gate Checklist
- [ ] Database design covers all PRD data entities (auto-check)
- [ ] API contract covers all page operations from PRD (auto-check)
- [ ] Permission model aligns with PRD permission matrix (auto-check)
- [ ] Tech stack choice has documented rationale
- [ ] For South Grid: 国产化/信创 requirements addressed if applicable
- [ ] User confirms architecture decisions

## References
- `references/api-contract-schema.md` — YAML schema for api-contract.yaml
- `references/db-naming-conventions.md` — database naming standards
- `references/south-grid-compliance.md` — South Grid compliance checklist (等保, 国产化)
- `references/tech-stack-templates/` — architecture templates per stack combination

## Critical Note
**`api-contract.yaml` is a cross-stage contract.** Once generated, it should be treated as read-only by downstream stages. If frontend or backend needs to change the API, the change must be proposed back to the architecture stage, and the contract updated before propagating to other stages.
