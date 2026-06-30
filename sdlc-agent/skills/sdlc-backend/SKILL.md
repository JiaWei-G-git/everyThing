---
name: sdlc-backend
description: Execute Stage 8 (Backend Coding) of the SDLC pipeline. Generate backend engineering scaffolding (database DDL, API routes, controllers, service interfaces, DAO, DTOs) based on tech architecture and API contract. Code is engineering scaffolding, not production-ready. Trigger when frontend is confirmed or user asks for backend code. Keywords: '后端开发', '后端代码', 'backend', 'API实现', '数据库', 'Spring Boot', 'FastAPI', 'service'.
---

# SDLC Backend Coding Stage 8

## Purpose
Generate backend engineering scaffolding — database DDL, API routes, controller/handler layer, service interfaces, DAO/repository, DTO/VO, and RBAC framework. This is scaffolding, not production code.

## Input
- `artifacts/06-tech-arch/v{N}/tech-arch.md`
- `artifacts/06-tech-arch/v{N}/db-design.md`
- `artifacts/api-contract.yaml` (READ-ONLY cross-stage contract)
- `artifacts/03-prd/v{N}/prd.md` (for data entity and permission requirements)
- `project-config.yaml` (backend stack, database type)

## Output
- `artifacts/08-backend/` directory with code files
- `artifacts/08-backend/sql/init.sql` (DDL)

## Workflow

### Step 1: Read Stack & Contract
1. Read `project-config.yaml` for backend stack (Spring Boot/FastAPI/Express/Go Gin)
2. Read `api-contract.yaml` — all endpoints are the implementation target
3. Read `db-design.md` for table definitions and ER relationships
4. Read `tech-arch.md` for architecture decisions and module division

### Step 2: Generate Database DDL
Write `sql/init.sql` with:
- All tables from `db-design.md`
- Standard admin tables: `sys_user`, `sys_role`, `sys_permission`, `sys_user_role`, `sys_role_permission`, `sys_log`, `sys_org` (org hierarchy for data authority)
- Naming conventions from `db-design.md`
- Indexes on frequently queried fields
- Comments on tables and columns (for database documentation)
- For South Grid/DWS: use compatible SQL syntax (no `REPLACE`, use `INSERT ON CONFLICT` or `MERGE`)

### Step 3: Generate Project Structure
Create directory structure based on stack:
```
artifacts/08-backend/
├── src/
│   ├── controller/      # API controllers / handlers
│   ├── service/         # Service interfaces (business logic stubs)
│   ├── service/impl/      # Service implementations (empty or CRUD only)
│   ├── dao/ or repository/ # Data access layer (CRUD operations)
│   ├── entity/ or model/  # Entity classes / ORM models
│   ├── dto/             # DTOs / request/response objects
│   ├── vo/              # VO / view objects
│   ├── config/          # Configuration classes
│   ├── interceptor/       # Auth interceptors, data authority interceptors
│   ├── exception/       # Global exception handler
│   └── utils/           # Common utilities (page wrapper, result wrapper)
├── sql/
│   └── init.sql
├── pom.xml / package.json / go.mod / requirements.txt
├── application.yml / .env
└── README.md
```

### Step 4: Generate Code Files
For each file, generate scaffolding:

- **Controllers**: One per API tag, all endpoints with request/response DTOs, parameter validation, swagger/openapi annotations
- **Service Interfaces**: Method signatures for all business operations, with TODO comments
- **Service Impl**: Empty or basic CRUD implementations, with TODO for complex logic
- **DAO/Repository**: CRUD methods, custom queries as method stubs with TODO
- **Entity/Model**: ORM-mapped classes with all fields, relationships, constraints
- **DTO/VO**: Request/response classes matching API contract schema
- **Config**: Database config, swagger config, CORS config, security config
- **Interceptor**: JWT auth interceptor, data authority interceptor (framework only, filtering logic TODO)
- **Exception**: Global exception handler, standard error response
- **Utils**: Page wrapper, Result wrapper (code/message/data), date utils, org tree utils

**Code Scaffolding Rules**:
- Match the API contract exactly — same paths, methods, parameters, response shapes
- Include all imports and annotations
- Include TODO for every business logic method
- Include pagination wrapper for all list endpoints
- Include standard response wrapper for all endpoints
- RBAC: framework with role-permission checks, data authority: framework with org hierarchy filtering (TODO)

### Step 5: Hallucination Defense
1. Check SQL syntax matches database type (MySQL/PostgreSQL/DWS/达梦)
   - DWS/PostgreSQL: `LIMIT/OFFSET`, `SERIAL`, `ON CONFLICT`
   - MySQL: `LIMIT start,count`, `AUTO_INCREMENT`
   - 达梦: check specific syntax compatibility
2. Verify all dependencies in pom.xml/package.json/go.mod exist
3. Check ORM annotations match the database dialect
4. Run syntax check if tools available (`mvn compile` / `go build` / `python -m py_compile`)

### Step 6: Consistency Check
Run `scripts/check-api-contract.py` (backend mode):
- Scan all controller routes in backend code
- Verify every route matches an endpoint in `api-contract.yaml`
- Verify every route in `api-contract.yaml` has a controller implementation
- Report missing or fictional endpoints

Run `scripts/check-ddl-coverage.py`:
- Compare `db-design.md` tables vs DDL in `init.sql`
- Report missing tables or columns

### Step 7: Write Output
Write all files to `artifacts/08-backend/`

### Step 8: Gate Review
Present: "后端代码已生成（工程骨架），请确认数据库设计和 API 实现是否覆盖完整？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, proceed to Stage 9
- User changes: Update specific files, re-run checks

## Gate Checklist
- [ ] Database DDL covers all tables from design (auto-check: compare db-design.md vs init.sql)
- [ ] All API contract endpoints have controller implementations (auto-check: scan vs api-contract.yaml)
- [ ] Permission model matches PRD matrix (auto-check: compare RBAC tables vs PRD)
- [ ] Code can compile/build (auto-check: run build command)
- [ ] No SQL injection risks (auto-check: scan for string concatenation in SQL)
- [ ] No plaintext key storage (auto-check: scan for hardcoded secrets)
- [ ] User confirms backend structure

## References
- `references/backend-scaffold-{spring,fastapi,express,go}.md` — framework-specific patterns
- `references/dws-sql-compatibility.md` — DWS/PostgreSQL compatibility notes
- `references/dameng-sql-compatibility.md` — 达梦 database compatibility notes
- `references/rbac-backend.md` — RBAC implementation patterns
- `references/data-authority-backend.md` — data authority (row-level filtering) implementation

## Important Notes
- Output is **scaffolding**, not production code. Complex business logic (e.g., 线损计算, 异常预警) is TODO-marked.
- For South Grid projects, org hierarchy data authority is implemented as MyBatis interceptor / AOP aspect framework, with actual filtering logic as TODO.
- DWS/达梦 compatibility: verify SQL syntax. Do not use `REPLACE` in DWS.
- Security: no SQL string concatenation; use parameterized queries OR ORM.
