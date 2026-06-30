# SDLC Agent 使用指南

> 版本：v1.0  
> 更新日期：2025-06-29  
> 适用对象：开发者、项目经理、技术决策者  
> 运行环境：Kimi Work（推荐）/ Claude Code / Cursor / 任意 LLM 工具

---

## 目录

1. [快速开始：3 分钟启动第一个项目](#1-快速开始3-分钟启动第一个项目)
2. [核心概念：5 个关键设计](#2-核心概念5-个关键设计)
3. [完整流程：从需求到代码（实战示例）](#3-完整流程从需求到代码实战示例)
4. [独立使用模式：只跑一个阶段](#4-独立使用模式只跑一个阶段)
5. [跨平台使用：Kimi / Claude / Cursor](#5-跨平台使用kimi--claude--cursor)
6. [需求变更：如何更新已有项目](#6-需求变更如何更新已有项目)
7. [经验复用：让新项目站在旧项目肩膀上](#7-经验复用让新项目站在旧项目肩膀上)
8. [文件与目录速查](#8-文件与目录速查)
9. [常见问题 FAQ](#9-常见问题-faq)
10. [故障排查](#10-故障排查)

---

## 1. 快速开始：3 分钟启动第一个项目

### 1.1 在 Kimi Work 中启动（推荐）

**第 1 步：打开对话，发送指令**

```
启动项目 南网计量系统 V2
```

**第 2 步：回答访谈问题**

Agent 会问你 3-5 个结构化问题（根据项目类型自动选择领域模板）：
- 项目层级？（省公司 / 地市供电局 / 区县）
- 核心数据？（电能表 / 台区 / 采集终端）
- 技术栈偏好？（Vue + Spring Boot / 其他）

**每条回答不需要很完整，想到什么说什么。** Agent 会追问补充。

**第 3 步：确认并继续**

Agent 生成 `01-discovery/draft/discovery.md`，问：

> "需求发现报告已生成，请确认是否完整？回复 Y 继续，或提出修改意见。"

回复 `Y` → 进入下一阶段（需求评审）

回复修改意见 → 如"补充用户层级" → Agent 更新报告再问

### 1.2 快速检查清单

启动前请确认：
- [ ] 项目名想好（中英文均可）
- [ ] 知道大概的用户角色（如管理员、班组长、运维人员）
- [ ] 知道核心数据类型（如电能表、台区、采集终端）
- [ ] 有偏好的技术栈就说，没有就交给 Agent 推荐
- [ ] 有现有 PRD/文档样本可以上传，让 Agent 学习格式

---

## 2. 核心概念：5 个关键设计

### 2.1 阶段（Stage）

流水线 9 个阶段，顺序执行：

```
需求发现 → 需求评审 → PRD → 原型 → UI规范 → 技术架构 → 前端编码 → 后端编码 → 测试
   1          2         3      4       5         6          7          8          9
```

每个阶段**独立可触发**，不强制走完整流程。

### 2.2 门禁（Gate Review）

每个阶段结束必须**你确认**才能继续。三种确认方式：

| 方式 | 你的操作 | 适用场景 |
|------|---------|---------|
| **简单确认** | 回复 `Y` 或 `确认` | 产物看起来没问题 |
| **修改意见** | 说"修改 [具体内容]" | 需要调整，Agent 修改后重问 |
| **直接改文件** | 自己打开文件编辑 → 说"改完了继续" | 你有明确修改方向，直接动手 |

### 2.3 版本（Version）

每个阶段的产物有两种版本：

| 类型 | 位置 | 说明 | 保留策略 |
|------|------|------|---------|
| **草稿** | `draft/` | 当前正在打磨的版本 | 只保留最新，覆盖更新 |
| **正式版** | `v1/`, `v2/`... | 通过门禁后的归档版本 | 永久保留，不删除 |

**需求变更**产生新正式版（v2、v3...）
**迭代打磨**不产生新正式版，只覆盖 draft/

### 2.4 产物（Artifact）

每个阶段产出标准化文件，存放位置：

```
projects/你的项目名/artifacts/
  ├── 01-discovery/
  │   ├── draft/discovery.md
  │   └── v1/discovery.md
  ├── 03-prd/
  │   ├── draft/prd.md
  │   └── v1/prd.md
  ├── 04-wireframe/
  │   ├── draft/wireframe.md + prototype.html
  │   └── v1/...
  ├── 06-tech-arch/
  │   ├── draft/tech-arch.md + db-design.md
  │   └── v1/...
  ├── 07-frontend/          ← 代码目录
  ├── 08-backend/           ← 代码目录
  └── 09-test/
      ├── draft/test-report.md
      └── v1/...
```

### 2.5 契约文件（api-contract.yaml）

技术架构阶段生成的**跨阶段契约**，前后端、测试都读取它：

```yaml
# 示例：API-001 查询用户列表
- id: "API-001"
  path: "/users"
  method: "GET"
  related_req: ["REQ-USER-001"]
  related_page: ["用户列表"]
  related_table: ["sys_user"]
```

**规则**：下游阶段只读，不修改。如需改 API，回到技术架构阶段更新。

---

## 3. 完整流程：从需求到代码（实战示例）

### 场景：你是一个南网项目开发者，要做"计量数据采集与线损分析系统"

### Step 1：启动项目

```
启动项目 南网计量数据采集系统
```

Agent 创建目录：
```
projects/南网计量数据采集系统/
  ├── project-config.yaml
  ├── sdlc.log
  └── artifacts/...
```

然后问：
> "这是南网项目，我使用南网领域模板。请先回答：1. 项目属于哪个层级？省公司 / 地市供电局 / 区县？"

你回答："地市供电局级别，面向广州供电局。"

Agent 继续追问...

### Step 2：回答访谈（约 5-10 分钟）

Agent 按模板依次问：
1. 项目层级 → 地市供电局
2. 用户角色 → 地市管理员、区县运维、班组长
3. 核心数据 → 电能表、台区、采集终端、负荷曲线
4. 功能模块 → 数据采集、线损计算、异常告警、统计报表
5. 数据权限 → 地市看全市，区县看本区县，班组看本班组
6. 技术栈 → 你说"Vue 3 + Element Plus + Spring Boot + MyBatis + DWS"
7. 等保要求 → 等保三级
8. 国产化 → 数据库用 DWS，其他不限

### Step 3：确认需求发现报告

Agent 生成 `artifacts/01-discovery/draft/discovery.md`

你检查，说："确认，但补充一点：需要 KPI 考核功能，采集成功率、线损率。"

Agent 更新 draft，再问。你回复 `Y` → 产物移入 `v1/` → 进入阶段 2

### Step 4：需求评审（自动执行，快速确认）

Agent 生成 `artifacts/02-review/draft/review.md`

内容：
- 技术可行性：Vue+Spring Boot+DWS 可行，DWS 注意 SQL 语法
- 风险：DWS 不支持 REPLACE INTO，需用 INSERT ON CONFLICT
- 建议：Go

你回复 `Y` → 进入阶段 3

### Step 5：PRD 撰写

Agent 生成 `artifacts/03-prd/draft/prd.md` + `rtm-initial.md`

包含：
- REQ-METER-001: 电能表档案管理
- REQ-LOSS-001: 台区线损计算
- REQ-ALARM-001: 异常告警推送
- 数据实体：电能表、台区、负荷曲线、告警记录
- 权限矩阵：地市/区县/班组三级数据权限

你检查，说："线损计算模块需要支持日/月/年线损率统计，补充一下。"

Agent 更新 → 你确认 → 移入 `v1/` → 进入阶段 4

### Step 6：原型设计

Agent 生成：
- `artifacts/04-wireframe/draft/wireframe.md` — 页面结构清单（12 个页面）
- `artifacts/04-wireframe/draft/prototype.html` — 低保真 HTML 原型

页面清单示例：
```
| 页面名称 | 路由 | 页面类型 | 核心组件 | 数据权限 |
|---------|------|---------|---------|---------|
| 电能表管理 | /meter/table | 列表页 | 表格、搜索、分页 | 按组织过滤 |
| 台区线损分析 | /loss/analysis | 仪表盘 | 图表、统计卡片 | 按组织过滤 |
| 异常告警 | /alarm/list | 列表页 | 表格、筛选、导出 | 按组织过滤 |
```

你回复 `Y` → 进入阶段 5

### Step 7：UI 设计

Agent 生成 `artifacts/05-ui-design/draft/ui-design.md`

设计令牌：
- 主色：#1890FF（南网蓝色系）
- 表格：紧凑行高，操作列右对齐
- 表单：两列自适应布局

你回复 `Y` → 进入阶段 6

### Step 8：技术架构

Agent 生成：
- `artifacts/06-tech-arch/draft/tech-arch.md` — 架构文档
- `artifacts/06-tech-arch/draft/db-design.md` — 数据库设计（12 张表）
- `artifacts/api-contract.yaml` — API 契约（28 个接口）

数据库设计包含：
- 标准表：sys_user, sys_role, sys_permission, sys_org（组织层级）
- 业务表：biz_meter, biz_taiqu, biz_load_curve, biz_alarm
- DWS 兼容：DISTRIBUTE BY HASH(id)，小表用 REPLICATION

Agent 自动运行 `check-db-coverage.py` 检查数据库覆盖 → 通过

你回复 `Y` → 进入阶段 7

### Step 9：前端编码

Agent 生成 `artifacts/07-frontend/` 代码目录：
```
src/
  ├── pages/
  │   ├── meter/          # 电能表管理
  │   ├── loss/           # 线损分析
  │   ├── alarm/          # 异常告警
  │   └── system/         # 系统管理
  ├── components/         # 通用表格、表单、搜索
  ├── services/           # API 封装（对应 api-contract.yaml）
  ├── router/             # 路由配置 + 权限守卫
  └── utils/              # 分页、日期、权限工具
```

Agent 自动运行：
- `check-api-contract.py` — 前端调用 vs API 契约 → 通过
- `check-route-conflict.py` — 路由冲突 → 无冲突
- `npm install` + `npm run build` — 编译 → 通过

你回复 `Y` → 进入阶段 8

### Step 10：后端编码

Agent 生成 `artifacts/08-backend/` 代码目录：
```
src/
  ├── controller/         # Controller 层（28 个接口）
  ├── service/          # Service 接口（业务逻辑 TODO）
  ├── service/impl/       # Service 实现（基础 CRUD）
  ├── dao/              # DAO / Mapper
  ├── entity/           # 实体类
  ├── dto/              # DTO / Request / Response
  ├── interceptor/      # JWT 认证 + 数据权限拦截器
  └── config/           # 配置类
sql/
  └── init.sql          # DDL（12 张表，DWS 兼容语法）
```

Agent 自动运行：
- `check-api-contract.py` — 后端路由 vs API 契约 → 通过
- `check-ddl-coverage.py` — 数据库设计 vs DDL → 通过
- `check-security.py` — 安全扫描 → 无 SQL 注入、无 XSS、无硬编码密钥

你回复 `Y` → 进入阶段 9

### Step 11：测试

Agent 生成：
- `artifacts/09-test/draft/test-report.md` — 测试计划 + 用例清单
- `artifacts/09-test/scripts/` — 测试脚本（JUnit）
- `artifacts/09-test/docker-compose.yml` — 测试环境
- `artifacts/09-test/mock-data/` — Mock 数据

测试用例示例：
```
TC-001: 电能表查询 — 正常查询 → 期望返回分页数据
TC-002: 电能表查询 — 无权限区县用户查询 → 期望 403
TC-003: 线损计算 — 日度线损率 → 期望正确计算
```

Agent 运行 `check-test-coverage.py` → 覆盖率 85% → 通过

你回复 `Y` → 全流程完成！

### 总耗时估算

| 阶段 | 时间 | 你的操作 |
|------|------|---------|
| 需求访谈 | 5-10 min | 回答问题 |
| 确认 Discovery | 2 min | 确认/修改 |
| 确认 Review | 1 min | 确认 |
| 确认 PRD | 3-5 min | 检查 + 修改 |
| 确认原型 | 2 min | 确认 |
| 确认 UI | 1 min | 确认 |
| 确认架构 | 3 min | 确认 |
| 确认前端 | 3 min | 确认 |
| 确认后端 | 3 min | 确认 |
| 确认测试 | 2 min | 确认 |
| **总计** | **~25-35 min** | **你只需回答和确认** |

---

## 4. 独立使用模式：只跑一个阶段

### 4.1 场景：你已有 PRD，只需要生成后端代码

**指令**：
```
从后端编码阶段开始，项目名：南网计量系统
技术栈：Spring Boot + MyBatis + DWS
已有 PRD 路径：projects/南网计量系统/artifacts/03-prd/v1/prd.md
```

Agent 检查前置产物：
- PRD 存在 ✅
- 架构文档？不存在 → 问你"是否需要先生成架构？"或"你提供技术栈即可"

你说"直接按 Spring Boot + MyBatis + DWS 生成" → Agent 直接生成后端代码

### 4.2 场景：你只需要数据库设计

**指令**：
```
只生成数据库设计
表结构：
- 用户表（id, username, password, org_id, role_id）
- 电能表表（id, meter_no, addr, org_id, status）
- 台区表（id, taiqu_name, parent_id, org_id）
数据库：DWS
```

Agent 直接调用 `sdlc-tech-arch` 的数据库设计子模块，生成 DDL。

### 4.3 场景：你只需要原型页面结构

**指令**：
```
只生成原型设计
功能：
1. 用户管理（列表、新增、编辑、删除）
2. 角色管理（列表、分配权限）
3. 系统配置（参数配置）
输出：页面结构清单 + 低保真 HTML
```

### 4.4 独立使用清单

| 你说 | Agent 执行 | 需要输入 |
|------|------------|---------|
| "只生成 PRD" | 调用 sdlc-prd | 业务描述 + 用户角色 + 功能清单 |
| "只生成数据库" | 调用 sdlc-tech-arch 子模块 | 表结构描述 + 数据库类型 |
| "只生成前端代码" | 调用 sdlc-frontend | 页面描述 + 技术栈 + API 规范（或让 Agent 生成） |
| "只生成后端代码" | 调用 sdlc-backend | 表结构 + API 需求 + 技术栈 |
| "只生成测试用例" | 调用 sdlc-test | 功能清单 + 权限矩阵 |
| "只生成 UI 规范" | 调用 sdlc-ui-design | 页面描述 + 设计偏好 |

---

## 5. 跨平台使用：Kimi / Claude / Cursor

### 5.1 Kimi Work（推荐，完整体验）

**优势**：
- 原生支持 Skill 系统，自动加载 `skills/`
- 自动文件读写（`artifacts/` 目录）
- 自动运行校验脚本（`scripts/`）
- 子 Agent 并行执行

**使用方式**：
```
直接发送指令："启动项目 XXX" 或 "从 XX 阶段开始"
Agent 自动处理文件操作，你只需回答和确认
```

### 5.2 Claude Code

**方式**：将产物文件作为上下文加载

**步骤**：
1. 在 Claude Code 中打开项目目录
2. 将 `SKILL.md` 内容粘贴到对话中，或让 Claude 读取文件
3. 手动管理文件：Claude 生成代码后，你自己保存到 `artifacts/`
4. 手动运行脚本：复制脚本内容到终端执行

**示例对话**：
```
你：请按照以下 SKILL 执行阶段 3 PRD 生成。输入文件：projects/我的项目/artifacts/01-discovery/v1/discovery.md
    [粘贴 sdlc-prd SKILL.md 内容]

Claude：[生成 PRD 内容]

你：请保存到 projects/我的项目/artifacts/03-prd/draft/prd.md

Claude：已保存。请确认是否继续？

你：确认
```

### 5.3 Cursor

**方式**：将 SKILL.md 作为 `.mdc` 规则文件或普通文件加载

**步骤**：
1. 将 `skills/sdlc-discovery/SKILL.md` 复制到 `.cursor/rules/`
2. 或直接在编辑器中打开 SKILL.md，让 Cursor 参考
3. 生成产物后，手动保存到 `artifacts/` 目录

**示例**：
```
你在 Cursor 中打开文件：skills/sdlc-frontend/SKILL.md

你：按这个规范生成前端代码。项目配置：Vue 3 + Element Plus。页面：用户列表、角色管理。

Cursor：生成代码 → 你复制粘贴到项目目录
```

### 5.4 其他 LLM 工具（Web 版 ChatGPT 等）

**方式**：产物以代码块输出，你手动保存

**步骤**：
1. 将 SKILL.md 的关键指令复制到对话
2. 提供输入（粘贴已有文档内容或描述需求）
3. LLM 生成产物（Markdown / 代码）
4. 你手动复制粘贴到文件系统

**降级模式**：无文件操作能力，全部手动管理。

### 5.5 跨平台兼容性总结

| 功能 | Kimi Work | Claude Code | Cursor | Web ChatGPT |
|------|-----------|-------------|--------|-------------|
| 自动文件读写 | ✅ | ⚠️ 需手动 | ⚠️ 需手动 | ❌ 手动 |
| 自动运行校验脚本 | ✅ | ⚠️ 需手动 | ⚠️ 需手动 | ❌ 手动 |
| 子 Agent 并行 | ✅ | ❌ | ❌ | ❌ |
| 门禁管理 | ✅ 自动 | ⚠️ 需手动 | ⚠️ 需手动 | ⚠️ 需手动 |
| 经验复用（知识库） | ✅ | ✅ 手动加载 | ✅ 手动加载 | ✅ 手动加载 |

**核心保证**：所有产物都是标准 Markdown / 代码，任何平台都能使用。

---

## 6. 需求变更：如何更新已有项目

### 6.1 场景：PRD 已确认，但要加一个功能

**你的指令**：
```
需求变更：南网计量系统
变更内容：增加"电能表批量导入"功能，支持 Excel 上传
```

**Agent 执行**：
1. 读取当前 `traceability-matrix.md`（RTM）
2. 分析影响范围：
   ```
   变更影响范围：
   - 新增 REQ-METER-005: 电能表批量导入
   - 原型：新增"批量导入"页面（或弹窗）
   - 数据库：biz_meter 表无需变更（字段已有）
   - API：新增 API-029 POST /meters/batch-import
   - 前端：用户列表页增加"导入"按钮 + 导入弹窗组件
   - 后端：新增批量导入 Controller + Service（解析 Excel）
   - 测试：新增导入测试用例（正常文件、格式错误、空文件）
   ```
3. 问你："请确认需要更新的模块：
   [x] PRD
   [x] 原型
   [ ] 数据库（无变化）
   [x] API 契约
   [x] 前端
   [x] 后端
   [x] 测试"
4. 你确认后，Agent 更新各模块的 `draft/` → 你确认 → 生成新的 `v2/` 版本

### 6.2 场景：发现前端代码有 bug，只改前端

**你的指令**：
```
修改南网计量系统的前端代码
问题：用户列表页的分页器不工作，页码点击后数据未刷新
```

Agent 直接修改 `artifacts/07-frontend/` 下的代码文件，重新运行 `npm run build` 检查，你确认即可。

**不需要**重新跑其他阶段。

### 6.3 变更管理规则

| 变更类型 | 影响范围 | 操作 |
|---------|---------|------|
| 新增功能 | PRD + 下游所有阶段 | 更新 PRD → 重新生成受影响阶段 |
| 修改功能 | 视修改范围 | 用 RTM 分析影响 → 只更新受影响阶段 |
| 删除功能 | PRD + 下游所有阶段 | 更新 PRD → 移除相关代码/测试 |
| 修改 UI 颜色 | 只 UI 规范 + 前端 CSS | 更新 UI → 重新生成前端样式 |
| 修改 API 字段 | API 契约 + 前后端 + 测试 | 更新契约 → 同步更新前后端 |
| 修改数据库字段 | 数据库 + 后端 + 前端 + 测试 | 更新 DDL → 同步更新实体/前端/测试 |
| 代码 bug 修复 | 只对应代码文件 | 直接修改代码，不需要重新跑阶段 |

---

## 7. 经验复用：让新项目站在旧项目肩膀上

### 7.1 自动推荐（新项目启动时）

当你启动新项目：
```
启动项目 南网线损分析系统 V2
```

Agent 自动检查 `knowledge-base/`：
> "发现已有类似项目：
> - 南网计量数据采集系统（技术栈：Vue + Spring Boot + DWS）
> - 踩坑记录：DWS 不支持 REPLACE INTO，需用 INSERT ON CONFLICT
> - 规范：使用 Element Plus 紧凑表格，操作列右对齐
> 是否应用这些经验？回复 Y 应用，或选择性应用。"

### 7.2 手动查询

```
查看经验
搜索：Spring Boot + DWS
```

Agent 列出相关经验条目：
```
【经验 1】DWS 批量插入优化
项目：南网计量数据采集系统
问题：10 万条数据插入慢
方案：使用 COPY 语法或分批 INSERT (1000 条/批)

【经验 2】DWS 分布键选择
项目：南网计量数据采集系统
问题：JOIN 性能差
方案：关联表使用相同分布键（如 org_id），避免数据重分布
```

### 7.3 项目归档（项目结束时）

Agent 自动从 `memory/` 提取经验，写入 `knowledge-base/`：
- 技术栈选择 → `project-index.json`
- 踩坑记录 → `best-practices/dws-pitfalls.md`
- 设计决策 → `best-practices/architecture-decisions.md`
- 编码规范 → `best-practices/coding-conventions.md`

---

## 8. 文件与目录速查

### 8.1 项目目录结构

```
projects/你的项目名/
├── project-config.yaml          # 项目配置（技术栈、设计偏好）
├── style-guide.md              # 模板学习产物（从已有文档提取）
├── sdlc.log                     # 执行日志（阶段状态、版本）
├── artifacts/                   # 阶段产物（核心资产）
│   ├── 01-discovery/
│   │   ├── draft/discovery.md   # 当前草稿（可修改）
│   │   └── v1/                  # 正式版（归档）
│   │       ├── discovery.md
│   │       └── gate-review.md   # 门禁审核记录
│   ├── 03-prd/
│   │   ├── draft/prd.md + rtm-initial.md
│   │   └── v1/...
│   ├── 04-wireframe/
│   │   ├── draft/wireframe.md + prototype.html
│   │   └── v1/...
│   ├── 05-ui-design/
│   │   └── draft/ui-design.md
│   ├── 06-tech-arch/
│   │   ├── draft/tech-arch.md + db-design.md
│   │   └── v1/...
│   ├── api-contract.yaml        # 跨阶段 API 契约（只读）
│   ├── traceability-matrix.md   # 需求追踪矩阵（持续更新）
│   ├── 07-frontend/             # 前端代码目录
│   ├── 08-backend/              # 后端代码目录
│   │   ├── src/...
│   │   └── sql/init.sql         # DDL 脚本
│   └── 09-test/
│       ├── draft/test-report.md
│       ├── scripts/              # 测试脚本
│       ├── docker-compose.yml    # 测试环境
│       └── mock-data/           # Mock 数据
└── memory/                      # 项目经验（自动归档）
    ├── tech-notes.md            # 技术踩坑
    ├── design-decisions.md      # 设计决策
    └── lessons-learned.md       # 经验教训
```

### 8.2 全局知识库

```
knowledge-base/
├── project-index.json           # 项目索引（名称、领域、技术栈）
├── domain-templates/
│   ├── energy-metering/         # 南网计量领域
│   │   ├── common-schemas.md    # 通用数据模型
│   │   ├── standard-features.md # 标准功能清单
│   │   └── prd-questions.md     # 需求访谈问题
│   └── general-admin/           # 通用后台管理领域
├── style-patterns/              # 已学习的设计风格
└── best-practices/              # 最佳实践
    ├── dws-pitfalls.md
    ├── architecture-decisions.md
    └── coding-conventions.md
```

### 8.3 技能定义

```
skills/
├── sdlc-orchestrator/SKILL.md          # 主控协调
├── sdlc-discovery/SKILL.md              # 阶段 1：需求发现
│   └── references/
│       ├── general-questions.md         # 通用访谈问题
│       └── domain-questions.md          # 南网领域问题
├── sdlc-review/SKILL.md                 # 阶段 2：需求评审
├── sdlc-prd/SKILL.md                    # 阶段 3：PRD
│   └── references/
│       ├── prd-template.md              # PRD 默认模板
│       └── req-id-rules.md              # REQ-ID 命名规范
├── sdlc-wireframe/SKILL.md              # 阶段 4：原型
│   └── scripts/
│       └── check-wireframe-coverage.py  # 原型覆盖检查
├── sdlc-ui-design/SKILL.md              # 阶段 5：UI 设计
├── sdlc-tech-arch/SKILL.md              # 阶段 6：技术架构
│   └── references/
│       ├── api-contract-schema.md       # API 契约规范
│       ├── dws-sql-compatibility.md     # DWS 兼容性
│       ├── dameng-sql-compatibility.md  # 达梦兼容性
│       └── south-grid-compliance.md      # 南网合规检查
├── sdlc-frontend/SKILL.md              # 阶段 7：前端编码
│   └── scripts/
│       ├── check-api-contract.py        # API 一致性检查
│       └── check-route-conflict.py      # 路由冲突检查
├── sdlc-backend/SKILL.md               # 阶段 8：后端编码
│   └── scripts/
│       ├── check-api-contract.py        # API 一致性检查
│       ├── check-ddl-coverage.py       # DDL 覆盖检查
│       └── check-security.py           # 安全编码扫描
│   └── references/
│       ├── rbac-backend.md              # RBAC 实现模式
│       └── data-authority-backend.md    # 数据权限实现
├── sdlc-test/SKILL.md                  # 阶段 9：测试
│   └── scripts/
│       └── check-test-coverage.py      # 测试覆盖率检查
│   └── references/
│       └── test-case-template.md       # 测试用例模板
└── sdlc-delivery/                      # 阶段 10：交付（预留）
```

---

## 9. 常见问题 FAQ

### Q1：我必须走完所有 9 个阶段吗？

**不需要。** 每个阶段可以独立触发。你可以：
- 只跑需求发现 + PRD，拿到文档后自己开发
- 从已有 PRD 开始，直接生成代码
- 只跑测试阶段，生成测试用例

### Q2：代码可以直接投产吗？

**不可以。** 代码定位为**工程骨架**：
- ✅ 包含：项目结构、路由、API 定义、基础 CRUD、权限框架、数据库 DDL
- ❌ 不包含：复杂业务逻辑（如线损计算公式）、性能优化、安全加固、第三方集成

你需要在骨架上填充业务逻辑，做安全审计，再投产。

### Q3：一个项目可以改多少次需求？

**无限次。** 每次变更产生新版本（v2、v3...），旧版本保留在 `v1/`、`v2/` 中。你可以随时回滚。

### Q4：技术栈可以中途改吗？

**可以。** 但影响范围大：
- 改前端框架（Vue → React）→ 重新生成前端代码（阶段 7）
- 改数据库（MySQL → DWS）→ 重新生成数据库 + 后端代码（阶段 6、8）
- 改后端语言（Java → Go）→ 重新生成后端代码（阶段 8）

建议用 `需求变更` 指令，Agent 会分析影响范围。

### Q5：多个项目可以共用经验吗？

**可以。** 所有项目经验自动归档到 `knowledge-base/`。新项目启动时，Agent 自动推荐相关经验。你也可以主动查询。

### Q6：我可以在 Claude / Cursor 中使用吗？

**可以。** 产物是标准 Markdown 和代码，任何平台都能使用。Kimi Work 体验最完整（自动文件操作），其他平台需要手动管理文件。

### Q7：校验脚本失败了怎么办？

**分两种情况**：
1. 脚本检测出错误（如 API 不一致）→ Agent 自动修复，或给你错误报告，你修改后重跑
2. 脚本本身报错（环境不兼容）→ 脚本有注释说明，你可以手动检查，或跳过脚本（记录风险）

### Q8：产物文件太大，LLM 上下文装不下怎么办？

Agent 会自动处理：
- 大型项目分模块加载（每次只处理一个模块）
- 代码分文件生成（不按全部塞在一个文件里）
- 历史产物通过文件路径引用，不重复加载全文

如果还是超限，你可以说"只生成 [某个模块] 的代码"。

### Q9：我想要的功能 Agent 没有怎么办？

**三种解决方式**：
1. **直接修改 SKILL.md** — 打开 `skills/sdlc-XXX/SKILL.md`，在指令里添加你的需求
2. **用独立模式** — 不调用技能，直接描述需求让 Agent 生成
3. **反馈改进** — 记录问题到 `memory/lessons-learned.md`，后续版本改进

### Q10：如何卸载或重置一个项目？

直接删除项目目录：
```bash
rm -rf projects/你的项目名/
```
或保留产物但重置状态，删除 `sdlc.log` 即可。

---

## 10. 故障排查

### 问题 1：Agent 说找不到前置产物

**原因**：你想从阶段 5 开始，但阶段 4 的产物不存在。

**解决**：
- 补齐前置阶段："先帮我补阶段 4 原型设计"
- 或手动提供输入："我没有原型，但我的页面是：用户列表、角色管理..."

### 问题 2：门禁检查不通过，Agent 反复修改

**原因**：产物质量不达标，自动校验失败。

**解决**：
- 查看检查报告，定位具体问题
- 直接修改文件（方式三），绕过 Agent 的自动修改
- 或放宽标准：告诉 Agent"跳过这个检查，记录风险"

### 问题 3：代码生成后编译失败

**原因**：LLM 幻觉（虚构依赖、错误语法、版本不兼容）。

**解决**：
1. 查看编译错误日志
2. 告诉 Agent："编译失败，错误是 [粘贴错误]"
3. Agent 会根据错误自动修复（幻觉防御机制）
4. 如果反复失败，检查 `project-config.yaml` 中的技术栈版本是否合理

### 问题 4：需求变更后，下游产物没有更新

**原因**：变更影响分析遗漏，或你勾选了"不更新某些模块"。

**解决**：
- 检查 `traceability-matrix.md`，确认变更影响范围
- 手动触发更新："更新前端代码，因为 PRD 加了新字段"
- 或重新跑相关阶段

### 问题 5：跨平台使用时产物丢失

**原因**：在 Claude/Cursor 中，产物没有自动保存到文件。

**解决**：
- 每次产物生成后，手动复制粘贴到 `artifacts/` 目录
- 建立习惯：每完成一个阶段，自己保存文件
- 或使用 Kimi Work（自动保存）做主体，Claude/Cursor 做辅助

---

## 附录：指令速查表

| 你的指令 | Agent 动作 |
|---------|----------|
| `启动项目 [项目名]` | 初始化项目 → 开始需求访谈 |
| `继续` / `Y` / `确认` | 通过当前阶段门禁 → 进入下一阶段 |
| `修改 [内容]` | 修改当前 draft 产物 → 重新审核 |
| `从 [阶段] 开始` | 检查前置产物 → 从指定阶段启动 |
| `只生成 [模块]` | 独立触发子模块（如"只生成数据库设计"） |
| `需求变更 [描述]` | 分析影响范围 → 更新受影响模块 |
| `查看进度` | 显示当前阶段状态、版本历史 |
| `查看经验` | 查询知识库，列出相关项目经验 |
| `上传模板 [文件]` | 提取格式标准 → 保存到 style-guide.md |
| `改完了继续` | 确认你手动修改的文件 → 进入下一阶段 |

---

*本指南随版本更新。如有问题，请记录到 `memory/lessons-learned.md` 供后续改进。*
