---
name: sdlc-test
description: Execute Stage 9 (Testing) of the SDLC pipeline. Generate test cases, test scripts, and test reports based on PRD, API contract, and generated code. Trigger when backend coding is confirmed or user asks for testing. Keywords: '测试', '测试用例', 'test', '验证', '验收', '自动化测试', '功能测试'.
---

# SDLC Test Stage 9

## Purpose
Generate test cases, test scripts, and a test report covering functional, API, and permission tests based on PRD and API contract.

## Input
- `artifacts/03-prd/v{N}/prd.md` (functional requirements)
- `artifacts/03-prd/v{N}/rtm-initial.md` (traceability matrix, updated by downstream stages)
- `artifacts/06-tech-arch/v{N}/db-design.md` (database schema)
- `artifacts/api-contract.yaml` (API endpoints)
- `artifacts/07-frontend/` (frontend code, for E2E test scope)
- `artifacts/08-backend/` (backend code, for API test scope)
- `project-config.yaml` (test stack, e.g., JUnit, pytest, Playwright)

## Output
- `artifacts/09-test/draft/test-report.md` (test plan + test case list + results)
- `artifacts/09-test/scripts/` (test scripts directory)
- `artifacts/09-test/docker-compose.yml` (test environment, optional)
- `artifacts/09-test/mock-data/` (mock data for testing)

## Workflow

### Step 1: Read Requirements & Contract
1. Read PRD and extract all REQ-IDs with descriptions
2. Read `api-contract.yaml` and extract all API endpoints
3. Read permission matrix from PRD
4. Read `project-config.yaml` for test framework preference

### Step 2: Generate Test Cases
For each REQ-ID, generate test cases covering:

**Functional Tests**:
- Positive case (normal input, expected output)
- Negative cases (invalid input, empty input, boundary values)
- Edge cases (max length, max pagination, special characters)

**API Tests** (per endpoint):
- Request/response schema validation
- Status code checks (200, 400, 401, 403, 404, 500)
- Parameter validation (missing required, invalid type, out of range)
- Pagination behavior (first page, last page, empty result)

**Permission Tests** (per role + page + operation):
- Access allowed with correct role → expect success
- Access denied with wrong role → expect 403
- Access denied without token → expect 401
- Data authority: user A can see data X, user B cannot see data X

**Test Case Format**:
```markdown
### TC-001: [Feature Name] - [Scenario]
- **REQ-ID**: REQ-USER-001
- **Type**: Functional / API / Permission
- **Priority**: High / Medium / Low
- **Preconditions**: [setup state]
- **Steps**: 1. ... 2. ... 3. ...
- **Expected Result**: ...
- **API Endpoint**: API-001 (if applicable)
- **Data**: [mock data reference]
```

### Step 3: Generate Test Scripts
Write test scripts based on project tech stack:

**API Tests** (Java/Spring: JUnit + RestAssured; Python: pytest + requests; Node: jest + supertest):
- One test class per API tag
- Each endpoint has at least 3 tests (positive, negative, permission)
- Test data loaded from mock-data files

**E2E Tests** (Playwright/Cypress/Selenium):
- Key user flows: login → navigate → CRUD → logout
- Permission flows: login as admin vs login as user → verify feature visibility
- Data authority flows: login as 地市管理员 → verify only 本市 data visible

**Permission Tests** (dedicated test suite):
- Test each role against each page/operation matrix cell
- Automated generation from PRD permission matrix

Write scripts to `artifacts/09-test/scripts/`

### Step 4: Generate Mock Data
Write mock data files to `artifacts/09-test/mock-data/`:
- `users.json`: test users with different roles and org levels
- `org-tree.json`: organization hierarchy (省/地市/区县/班组)
- `sample-data.json`: domain-specific test data (e.g., meters, measurements)

### Step 5: Generate Test Environment (Optional)
Write `docker-compose.yml` to `artifacts/09-test/`:
- Database container (PostgreSQL/MySQL, matching project config)
- Test data initialization script
- If backend stack is containerizable, include backend container for integration tests

### Step 6: Coverage Check
Run `scripts/check-test-coverage.py`:
- Compare PRD REQ-IDs vs test case list
- Report coverage percentage (target: ≥80%)
- Report missing coverage (REQ-IDs with no test cases)
- Compare API contract endpoints vs API test cases
- Report missing API tests

### Step 7: Generate Test Report
Write `test-report.md` with:
- Test Plan Overview (scope, strategy, environment)
- Test Case Summary (total, by type, by priority)
- Coverage Report (REQ coverage %, API coverage %, permission coverage %)
- Execution Results (if tests were run — can be manual entry)
- Defect List (if any found during test execution)
- Risk Assessment (untested areas, known issues)
- Sign-off

### Step 8: Write Output
Write all files to `artifacts/09-test/draft/`

### Step 9: Gate Review
Present: "测试方案已生成，请确认测试用例覆盖是否完整？回复 Y 确认，或提出修改意见。"

- User confirms: Move to `v1/`, testing stage complete
- User changes: Update test cases, re-run coverage check

## Gate Checklist
- [ ] Test cases cover ≥80% of PRD requirements (auto-check: compare REQ-IDs vs TC list)
- [ ] API tests cover all contract endpoints (auto-check: compare API list vs API TC list)
- [ ] Permission tests cover all role+operation combinations (auto-check: compare matrix vs permission TC list)
- [ ] E2E tests cover key business flows (manual check: user confirms critical paths)
- [ ] Mock data includes all user roles and org levels (manual check)
- [ ] User confirms test scope is sufficient

## References
- `references/test-case-template.md` — test case writing format
- `references/api-test-patterns-{junit,pytest,jest}.md` — framework-specific API test patterns
- `references/e2e-test-patterns.md` — E2E test scenarios for admin systems
- `references/permission-test-matrix.md` — permission test generation from PRD matrix

## Important Notes
- Test execution is optional. If test environment is not available, report is a test plan with cases ready for execution.
- Mock data must include the full org hierarchy (省/地市/区县/班组/供电所) for data authority tests.
- For South Grid projects, always test data authority: user at level N can only see data at level N and below.
