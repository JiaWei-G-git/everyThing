# SDLC Agent 架构设计

## 设计哲学

**流水线（Pipeline）+ 阶段门禁（Stage Gate）模式**

- 每个阶段是一个独立、可复用的技能（Skill）
- 阶段间通过**标准化 Markdown 文件**传递产物，不依赖内存状态
- 每个阶段结束时必须通过质量门禁（Gate Review）才能进入下一阶段
- 支持单阶段独立触发，也支持全流程自动触发

## 阶段定义

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. Discovery│ → │  2. PRD     │ → │  3. Wireframe│ → │  4. UI Design│
│  需求发现     │    │  产品需求    │    │  原型设计    │    │  UI 设计     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                             ↓
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  9. Delivery │ ← │  8. Test    │ ← │  7. Backend │ ← │  6. Frontend │
│  交付部署     │    │  测试验证    │    │  后端开发    │    │  前端开发    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
         ↑
    ┌─────────────┐
    │  5. Tech Arch│
    │  技术架构     │
    └─────────────┘
```

## 阶段接口规范

### 输入/输出标准

每个阶段产生一个标准化的 Markdown 文档，存放在项目的 `artifacts/` 目录下：

| 阶段 | 输出文件 | 格式 |
|------|---------|------|
| 1. Discovery | `artifacts/01-discovery.md` | Markdown |
| 2. PRD | `artifacts/02-prd.md` | Markdown + YAML frontmatter |
| 3. Wireframe | `artifacts/03-wireframe.md` | Markdown + ASCII/文本描述 + 可选 HTML |
| 4. UI Design | `artifacts/04-ui-design.md` | Markdown + 颜色/字体规范 + 组件描述 |
| 5. Tech Arch | `artifacts/05-tech-arch.md` | Markdown + 架构图描述 + API 规范 |
| 6. Frontend | `artifacts/06-frontend/` | 代码目录 |
| 7. Backend | `artifacts/07-backend/` | 代码目录 |
| 8. Test | `artifacts/08-test-report.md` | Markdown + 测试用例 + 结果 |
| 9. Delivery | `artifacts/09-delivery.md` | Markdown + 部署文档 |

### 阶段门禁（Gate Criteria）

每个阶段结束前必须回答：

1. **完整性**：是否覆盖了所有必要的内容？
2. **一致性**：与上一阶段的产物是否冲突？
3. **可验证性**：产物是否足够具体，可供下一阶段执行？
4. **风险**：是否有重大未解决问题？

## 主控协调器（Orchestrator）

`sdlc-orchestrator` 技能负责：

1. 解析用户输入，确定启动阶段
2. 检查前置阶段产物是否存在且通过门禁
3. 调用对应阶段技能执行
4. 收集产物，判断是否进入下一阶段
5. 维护项目状态日志

## 使用方式

### 方式一：全流程（全自动）

```
用户："我要做一个在线教育平台，支持直播课程、作业提交和考试系统"
Agent：→ 自动执行阶段 1 → 门禁 → 阶段 2 → ... → 阶段 9
```

### 方式二：单阶段触发（半自动）

```
用户："我已经有了 PRD，请帮我生成原型设计"
Agent：→ 检查 02-prd.md → 执行阶段 3 → 输出 03-wireframe.md
```

### 方式三：迭代优化

```
用户："原型设计第三页的流程不对，帮我调整"
Agent：→ 读取当前 03-wireframe.md → 修改指定页面 → 重新门禁检查
```

## 技术栈建议（可配置）

| 层级 | 默认技术栈 | 说明 |
|------|----------|------|
| 前端 | React + TypeScript + Tailwind | 通用、组件丰富 |
| 后端 | Node.js/Express 或 Python/FastAPI | 根据复杂度选择 |
| 数据库 | PostgreSQL + Redis | 关系型 + 缓存 |
| 部署 | Docker + docker-compose | 本地开发环境 |
| 原型 | HTML + CSS 或 Figma 描述 | 可输出可交互 HTML |

## 扩展性设计

1. **技术栈切换**：Tech Arch 阶段支持用户指定技术栈，后续阶段读取配置并适配
2. **微前端/微服务**：复杂项目支持模块化拆分，每个模块独立流水线
3. **自定义门禁**：项目级别可配置额外的门禁检查项
4. **插件化**：新阶段可以作为插件插入流水线

## 文件目录结构

```
project-root/
├── artifacts/              # 阶段产物（核心资产）
│   ├── 01-discovery.md
│   ├── 02-prd.md
│   ├── 03-wireframe.md
│   ├── 04-ui-design.md
│   ├── 05-tech-arch.md
│   ├── 06-frontend/
│   ├── 07-backend/
│   ├── 08-test-report.md
│   └── 09-delivery.md
├── assets/                 # 技能共享资源（模板、代码片段等）
├── memory/                 # 项目记忆（决策日志、经验教训）
└── sdlc.log               # 执行日志
```
