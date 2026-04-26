# Everything Claude Code (ECC) 完整使用指南

> **版本**: 1.10.0  
> **最后更新**: 2026-04-08

---

## 📖 目录

1. [ECC 简介](#ecc-简介)
2. [核心原则](#核心原则)
3. [技能系统 (Skills)](#技能系统-skills)
4. [约束规则 (Rules)](#约束规则-rules)
5. [代理系统 (Agents)](#代理系统-agents)
6. [命令系统 (Commands)](#命令系统-commands)
7. [钩子系统 (Hooks)](#钩子系统-hooks)
8. [MCP 配置](#mcp-配置)
9. [使用工作流](#使用工作流)
10. [快速参考](#快速参考)

---

## ECC 简介

Everything Claude Code (ECC) 是一个**生产就绪的 AI 编程插件系统**，提供：

| 组件 | 数量 | 说明 |
|------|------|------|
| **Agents** | 47+ | 专业化子代理 |
| **Skills** | 181+ | 工作流技能和领域知识 |
| **Commands** | 79+ | 斜杠命令 |
| **Rules** | 178+ | 约束规则 |
| **MCP Configs** | 14+ | MCP 服务器配置 |

### 项目结构

```
everything-claude-code/
├── agents/          # 专业化子代理
├── skills/          # 工作流技能和领域知识
├── commands/        # 斜杠命令 (遗留兼容层)
├── hooks/           # 触发式自动化
├── rules/           # 始终遵循的指南
├── scripts/         # 跨平台 Node.js 工具
├── mcp-configs/     # MCP 服务器配置
├── tests/           # 测试套件
└── docs/            # 文档
```

---

## 核心原则

1. **Agent-First** — 将任务委派给专业代理处理
2. **Test-Driven** — 先写测试，80%+ 覆盖率
3. **Security-First** — 绝不妥协安全，验证所有输入
4. **Immutability** — 始终创建新对象，永不修改现有对象
5. **Plan Before Execute** — 复杂功能先规划再编码

---

## 技能系统 (Skills)

### 什么是 Skill？

Skills 是可复用的能力模块，每个 Skill 包含：
- **何时使用** — 触发条件
- **工作原理** — 详细说明
- **示例代码** — 实际使用案例

### 技能分类

#### 🧪 1. 核心开发工作流 (Core Workflow)

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `tdd-workflow` | 测试驱动开发工作流 | 新功能、Bug 修复、重构 |
| `verification-loop` | 全面验证系统 | 功能完成后、PR 前 |
| `security-review` | 安全审查清单 | 认证、输入处理、API 端点 |
| `blueprint` | 复杂项目规划 | 多会话、多 PR 的大任务 |
| `search-first` | 先搜索再编码 | 添加功能前查找现有方案 |
| `prompt-optimizer` | 提示词优化 | 优化用户提示词 |
| `eval-harness` | 评估驱动开发 | 定义成功标准、回归测试 |

**使用示例**:
```
# TDD 工作流
用户: "添加用户登录功能"
→ 激活 tdd-workflow
→ 先写测试 (RED)
→ 最小实现 (GREEN)
→ 重构优化 (IMPROVE)

# 验证循环
用户: "功能完成了"
→ 激活 verification-loop
→ 检查构建、类型、Lint、测试、安全、Diff
→ 输出验证报告
```

---

#### 🎨 2. 前端开发 (Frontend)

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `frontend-patterns` | React/Next.js 模式 | 前端开发 |
| `frontend-design` | 高质量 UI 设计 | 构建视觉导向的界面 |
| `frontend-slides` | HTML 演示文稿 | 创建/转换 PPT |
| `nextjs-turbopack` | Next.js 16+ & Turbopack | Next.js 项目 |
| `e2e-testing` | Playwright E2E 测试 | 关键用户流程测试 |

---

#### 🖥️ 3. 后端开发 (Backend)

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `backend-patterns` | 后端架构模式 | Node.js/Express/Next.js API |
| `api-design` | REST API 设计 | 设计生产级 API |
| `database-migrations` | 数据库迁移 | 模式变更、数据迁移 |
| `postgres-patterns` | PostgreSQL 模式 | 查询优化、模式设计 |
| `docker-patterns` | Docker 容器化 | 本地开发、多服务编排 |
| `deployment-patterns` | 部署模式 | CI/CD、生产就绪检查 |

---

#### 🐍 4. Python 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `python-patterns` | Python 最佳实践 | 编写 Python 代码 |
| `python-testing` | pytest 测试 | Python 测试 |
| `django-patterns` | Django 架构 | Django 项目 |
| `django-tdd` | Django TDD | Django 测试 |
| `django-security` | Django 安全 | Django 安全配置 |
| `django-verification` | Django 验证 | Django 发布前检查 |

---

#### ☕ 5. Java/Kotlin 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `java-coding-standards` | Java 编码标准 | Java/Spring Boot |
| `springboot-patterns` | Spring Boot 模式 | Spring Boot 后端 |
| `springboot-tdd` | Spring Boot TDD | Spring Boot 测试 |
| `springboot-security` | Spring Boot 安全 | Spring Boot 安全配置 |
| `kotlin-patterns` | Kotlin 最佳实践 | Kotlin 开发 |
| `kotlin-testing` | Kotlin 测试 | Kotlin 测试 |
| `kotlin-coroutines-flows` | Kotlin 协程 | 异步编程 |
| `android-clean-architecture` | Android 整洁架构 | Android/KMP 项目 |

---

#### 🦀 6. Rust 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `rust-patterns` | Rust 最佳实践 | Rust 开发 |
| `rust-testing` | Rust 测试 | Rust 测试 |

---

#### 🐹 7. Go 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `golang-patterns` | Go 最佳实践 | Go 开发 |
| `golang-testing` | Go 测试 | Go 测试 |

---

#### 🎯 8. C++ 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `cpp-coding-standards` | C++ 核心指南 | C++ 代码审查 |
| `cpp-testing` | GoogleTest/CTest | C++ 测试 |

---

#### 📱 9. Swift/iOS 生态

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `swiftui-patterns` | SwiftUI 架构 | iOS/macOS UI |
| `swift-concurrency-6-2` | Swift 6.2 并发 | 现代并发模式 |
| `swift-actor-persistence` | Actor 持久化 | 线程安全数据 |
| `liquid-glass-design` | iOS 26 Liquid Glass | 新设计系统 |

---

#### 🔗 10. 区块链/Web3

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `defi-amm-security` | DeFi AMM 安全 | 去中心化金融 |
| `llm-trading-agent-security` | 交易代理安全 | AI 交易代理 |
| `evm-token-decimals` | EVM Token 精度 | Token 处理 |
| `nodejs-keccak256` | Keccak-256 哈希 | 加密操作 |

---

#### 🤖 11. AI/LLM 集成

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `claude-api` | Claude API 模式 | 集成 Claude API |
| `mcp-server-patterns` | MCP 服务器构建 | 构建 MCP 服务器 |
| `cost-aware-llm-pipeline` | LLM 成本优化 | 模型路由、预算跟踪 |
| `fal-ai-media` | fal.ai 媒体生成 | 图片/视频/音频生成 |
| `pytorch-patterns` | PyTorch 模式 | 深度学习 |

---

#### 📊 12. 数据与运维

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `clickhouse-io` | ClickHouse 分析 | 分析型工作负载 |
| `data-scraper-agent` | AI 数据收集代理 | 自动化数据抓取 |
| `continuous-agent-loop` | 持续代理循环 | 长时运行工作负载 |
| `autonomous-loops` | 自主循环架构 | 多代理 DAG 系统 |

---

#### 📝 13. 内容与文档

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `article-writing` | 文章写作 | 长文、博客、教程 |
| `content-engine` | 内容系统 | 社交媒体内容 |
| `crosspost` | 多平台发布 | X/LinkedIn/Threads/Bluesky |
| `documentation-lookup` | 文档查询 | API/框架问题 |
| `deep-research` | 深度研究 | 多源综合研究 |
| `market-research` | 市场研究 | 竞争分析、尽职调查 |

---

#### 🎬 14. 媒体与视频

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `video-editing` | AI 视频编辑 | 剪辑、结构、增强 |
| `remotion-video-creation` | Remotion 视频 | React 视频创建 |
| `manim-video` | Manim 动画 | 技术概念动画 |
| `ui-demo` | UI 演示录制 | Playwright 录屏 |
| `videodb` | 视频分析处理 | 视频理解、转码、编辑 |

---

#### 🔒 15. 安全与合规

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `hipaa-compliance` | HIPAA 合规 | 医疗健康数据 |
| `healthcare-phi-compliance` | PHI 合规 | 受保护健康信息 |
| `security-scan` | 配置安全扫描 | 扫描 ECC 配置 |

---

#### 🏥 16. 医疗健康

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `healthcare-cdss-patterns` | CDSS 模式 | 临床决策支持 |
| `healthcare-emr-patterns` | EMR 模式 | 电子病历系统 |
| `healthcare-eval-harness` | 医疗评估框架 | 医疗设备评估 |

---

#### 💼 17. 业务运营

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `carrier-relationship-management` | 承运商管理 | 物流承运商 |
| `customs-trade-compliance` | 海关贸易合规 | 进出口合规 |
| `inventory-demand-planning` | 需求预测 | 库存管理 |
| `logistics-exception-management` | 物流异常处理 | 货运异常 |
| `production-scheduling` | 生产排程 | 制造排程 |
| `quality-nonconformance` | 质量不合规 | 质量控制 |
| `returns-reverse-logistics` | 退货逆向物流 | 退货处理 |
| `energy-procurement` | 能源采购 | 电力/天然气采购 |
| `customer-billing-ops` | 客户计费 | 订阅/退款 |

---

#### 🚀 18. 创业与融资

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `investor-materials` | 投资人材料 |  pitch deck、财务模型 |
| `investor-outreach` | 投资人外联 | 冷邮件、跟进 |
| `lead-intelligence` | 线索智能 | AI 线索评分 |

---

#### 🔧 19. 运维与工具

| Skill | 描述 | 何时使用 |
|-------|------|----------|
| `dmux-workflows` | 多代理编排 | tmux 多代理工作流 |
| `claude-devfleet` | Claude DevFleet | 多代理编码任务 |
| `github-ops` | GitHub 运维 | Issue/PR 管理 |
| `google-workspace-ops` | Google Workspace | Drive/Docs/Sheets |
| `configure-ecc` | ECC 配置 | 安装和配置 ECC |
| `workspace-surface-audit` | 工作区审计 | 审计可用能力 |

---

## 约束规则 (Rules)

### 规则结构

Rules 组织为**通用层** + **语言特定层**：

```
rules/
├── common/          # 语言无关原则（始终安装）
│   ├── coding-style.md      # 编码风格
│   ├── git-workflow.md      # Git 工作流
│   ├── testing.md           # 测试要求
│   ├── performance.md       # 性能指南
│   ├── patterns.md          # 设计模式
│   ├── hooks.md             # Hooks 配置
│   ├── agents.md            # Agent 使用
│   └── security.md          # 安全指南
├── typescript/      # TypeScript/JavaScript 特定
├── python/          # Python 特定
├── golang/          # Go 特定
├── java/            # Java 特定
├── kotlin/          # Kotlin 特定
├── rust/            # Rust 特定
├── cpp/             # C++ 特定
├── swift/           # Swift 特定
├── php/             # PHP 特定
├── dart/            # Dart/Flutter 特定
├── perl/            # Perl 特定
├── csharp/          # C# 特定
└── web/             # Web/前端特定
```

### 通用规则详解 (Common Rules)

#### 1. Security — 安全指南

**何时添加**:
- 所有项目必须安装
- 处理敏感数据的项目
- 需要认证/授权的项目

**核心要求**:
```markdown
提交前必须检查：
- [ ] 没有硬编码密钥（API keys, passwords, tokens）
- [ ] 所有用户输入已验证
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（HTML 消毒）
- [ ] CSRF 保护已启用
- [ ] 认证/授权已验证
- [ ] 所有端点有速率限制
- [ ] 错误信息不泄露敏感数据
```

**发现安全问题时的流程**:
1. 立即停止
2. 使用 `security-reviewer` agent
3. 修复 CRITICAL 问题
4. 轮换已暴露的密钥
5. 审查代码库中的类似问题

---

#### 2. Testing — 测试要求

**何时添加**:
- 所有项目必须安装
- 强调质量的项目

**核心要求**:
```markdown
最低覆盖率：80%

测试类型（全部必需）：
1. 单元测试 — 函数、工具、组件
2. 集成测试 — API 端点、数据库操作
3. E2E 测试 — 关键用户流程

TDD 工作流（强制）：
1. 先写测试（RED）
2. 运行测试 — 应该失败
3. 最小实现（GREEN）
4. 运行测试 — 应该通过
5. 重构（IMPROVE）
6. 验证覆盖率 80%+
```

---

#### 3. Coding-Style — 编码风格

**何时添加**:
- 所有项目必须安装

**核心原则**:
```markdown
不可变性（关键）：始终创建新对象，永不修改

文件组织：
- 多小文件优于少大文件
- 200-400 行典型，800 行最大
- 按功能/领域组织，不按类型

错误处理：
- 每层都处理错误
- UI 代码提供用户友好消息
- 服务端记录详细上下文
- 永不静默吞掉错误

输入验证：
- 在系统边界验证所有用户输入
- 使用基于模式的验证
- 快速失败，信息清晰
- 永不信任外部数据
```

---

#### 4. Git-Workflow — Git 工作流

**何时添加**:
- 所有项目必须安装

**提交格式**:
```markdown
<type>: <description>

Types:
- feat: 新功能
- fix: Bug 修复
- refactor: 重构
- docs: 文档
- test: 测试
- chore: 杂项
- perf: 性能
- ci: CI/CD
```

---

#### 5. Performance — 性能指南

**何时添加**:
- 性能敏感的项目
- 大规模重构项目

**核心要求**:
```markdown
上下文管理：
- 大型重构和多文件功能避免使用最后 20% 的上下文窗口
- 低敏感度任务（单编辑、文档、简单修复）可容忍更高使用率

构建故障排除：
- 使用 build-error-resolver agent
- 分析错误
- 增量修复
- 每次修复后验证
```

---

#### 6. Patterns — 架构模式

**何时添加**:
- 所有项目建议安装

**核心模式**:
```markdown
API 响应格式：
- 成功指示器
- 数据负载
- 错误信息
- 分页元数据

仓库模式：
- 将数据访问封装在标准接口后
- 业务逻辑依赖抽象接口，而非存储机制
```

---

#### 7. Agents — Agent 使用指南

**何时添加**:
- 使用 Agent 系统的项目

**核心要求**:
```markdown
Agent 优先级：
- 复杂功能请求 → planner
- 刚编写/修改的代码 → code-reviewer
- Bug 修复或新功能 → tdd-guide
- 架构决策 → architect
- 安全敏感代码 → security-reviewer

并行执行：
- 对独立操作使用并行执行
- 同时启动多个 agent
```

---

#### 8. Hooks — Hooks 配置

**何时添加**:
- 需要自动化触发器的项目

---

### 语言特定规则

#### 何时添加语言规则

| 项目类型 | 添加的规则 |
|----------|------------|
| TypeScript/React/Node.js | `typescript/`, `web/` |
| Python/Django/Flask | `python/` |
| Go | `golang/` |
| Java/Spring Boot | `java/` |
| Kotlin/Android/KMP | `kotlin/` |
| Rust | `rust/` |
| C++ | `cpp/` |
| Swift/iOS | `swift/` |
| PHP/Laravel | `php/` |
| Dart/Flutter | `dart/` |
| Perl | `perl/` |
| C#/.NET | `csharp/` |

#### 规则优先级

当语言特定规则与通用规则冲突时，**语言特定规则优先**（具体优先于通用）。

---

## 代理系统 (Agents)

### 什么是 Agent？

Agents 是专业化的子代理，每个 Agent 有：
- **特定角色** — 专注的领域
- **推荐模型** — 使用的 AI 模型
- **可用工具** — 可调用的工具集
- **触发条件** — 何时激活

### Agent 使用原则

**主动使用** — 无需用户提示，在适当时机自动使用 Agent：
- 复杂功能请求 → **planner**
- 刚编写/修改的代码 → **code-reviewer**
- Bug 修复或新功能 → **tdd-guide**
- 架构决策 → **architect**
- 安全敏感代码 → **security-reviewer**
- 自主循环/循环监控 → **loop-operator**

**并行执行** — 对独立操作同时启动多个 Agent

---

### 核心 Agent 详解

#### 1. planner — 实现规划专家

**模型**: Opus (最强推理)

**何时使用**:
- 复杂功能和重构
- 需要详细实施计划
- 多阶段任务

**能力**:
- 分析需求并创建详细实施计划
- 将复杂功能分解为可管理步骤
- 识别依赖关系和潜在风险
- 建议最佳实施顺序

**输出格式**:
```markdown
# Implementation Plan: [Feature Name]

## Overview
## Requirements
## Architecture Changes
## Implementation Steps
### Phase 1
### Phase 2
## Testing Strategy
## Risks & Mitigations
## Success Criteria
```

---

#### 2. architect — 系统设计与扩展性

**模型**: Opus

**何时使用**:
- 架构决策
- 技术选型
- 扩展性规划

**能力**:
- 设计系统架构
- 评估技术方案
- 规划扩展性

---

#### 3. tdd-guide — 测试驱动开发

**模型**: Sonnet

**何时使用**:
- 新功能开发
- Bug 修复
- 强制 TDD 工作流

**能力**:
- 先写测试，后实现
- 确保 80%+ 覆盖率
- 指导 RED-GREEN-REFACTOR 循环

---

#### 4. code-reviewer — 代码质量与可维护性

**模型**: Sonnet

**何时使用**:
- 编写/修改代码后立即使用（必须）
- PR 前审查
- 质量检查

**能力**:
- 检查安全（CRITICAL）
- 检查代码质量（HIGH）
- 检查 React/Next.js 模式（HIGH）
- 检查性能（MEDIUM）
- 检查最佳实践（LOW）

**审查清单**:
```markdown
### Security (CRITICAL)
- 硬编码凭证
- SQL 注入
- XSS 漏洞
- 路径遍历
- CSRF 漏洞
- 认证绕过
- 依赖漏洞

### Code Quality (HIGH)
- 大函数（>50 行）
- 大文件（>800 行）
- 深层嵌套（>4 层）
- 缺少错误处理
- 修改模式（应该用不可变）
- console.log 语句
- 缺少测试
- 死代码
```

**审查输出格式**:
```markdown
## Review Summary
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0     | pass   |
| HIGH     | 2     | warn   |
| MEDIUM   | 3     | info   |
| LOW      | 1     | note   |

Verdict: WARNING — 2 HIGH issues should be resolved before merge.
```

---

#### 5. security-reviewer — 漏洞检测

**模型**: Sonnet

**何时使用**:
- 提交前
- 敏感代码
- 安全审查

**能力**:
- 深度安全分析
- 漏洞检测
- 安全建议

---

#### 6. build-error-resolver — 构建/类型错误修复

**模型**: Sonnet

**何时使用**:
- 构建失败时
- 类型错误
- 编译错误

**能力**:
- 分析构建错误
- 提供修复方案
- 增量修复

---

#### 7. e2e-runner — Playwright E2E 测试

**模型**: Sonnet

**何时使用**:
- 关键用户流程
- E2E 测试执行
- 回归测试

**能力**:
- 生成 E2E 测试
- 执行测试
- 报告结果

---

#### 8. refactor-cleaner — 死代码清理

**模型**: Sonnet

**何时使用**:
- 代码维护
- 清理死代码
- 重构项目

**能力**:
- 识别死代码
- 安全删除
- 代码简化

---

#### 9. doc-updater — 文档和代码地图

**模型**: Sonnet

**何时使用**:
- 更新文档
- 维护代码地图
- 文档同步

**能力**:
- 更新文档
- 生成代码地图
- 维护 README

---

### 语言特定 Agent

| Agent | 用途 | 何时使用 |
|-------|------|----------|
| `cpp-reviewer` | C++ 代码审查 | C++ 项目 |
| `cpp-build-resolver` | C++ 构建错误 | C++ 构建失败 |
| `go-reviewer` | Go 代码审查 | Go 项目 |
| `go-build-resolver` | Go 构建错误 | Go 构建失败 |
| `kotlin-reviewer` | Kotlin 代码审查 | Kotlin/Android/KMP |
| `kotlin-build-resolver` | Kotlin/Gradle 错误 | Kotlin 构建失败 |
| `java-reviewer` | Java/Spring Boot 审查 | Java/Spring Boot |
| `java-build-resolver` | Java/Maven/Gradle 错误 | Java 构建失败 |
| `python-reviewer` | Python 代码审查 | Python 项目 |
| `rust-reviewer` | Rust 代码审查 | Rust 项目 |
| `rust-build-resolver` | Rust 构建错误 | Rust 构建失败 |
| `typescript-reviewer` | TypeScript/JS 审查 | TypeScript/JS 项目 |
| `database-reviewer` | PostgreSQL/Supabase | 模式设计、查询优化 |
| `pytorch-build-resolver` | PyTorch 运行时/CUDA | PyTorch 构建/训练失败 |

### 运营 Agent

| Agent | 用途 | 何时使用 |
|-------|------|----------|
| `loop-operator` | 自主循环执行 | 安全运行循环、监控停滞 |
| `harness-optimizer` | Harness 配置调优 | 可靠性、成本、吞吐量 |
| `docs-lookup` | Context7 文档查询 | API/文档问题 |

---

## 命令系统 (Commands)

### 核心命令

| 命令 | 描述 | 对应 Agent/Skill |
|------|------|------------------|
| `/plan` | 实施规划 | planner agent |
| `/tdd` | TDD 工作流 | tdd-guide agent + tdd-workflow skill |
| `/code-review` | 代码审查 | code-reviewer agent |
| `/verify` | 验证循环 | verification-loop skill |
| `/e2e` | 生成并运行 E2E 测试 | e2e-runner agent |
| `/build-fix` | 修复构建错误 | build-error-resolver agent |
| `/learn` | 从会话中提取模式 | continuous-learning skill |
| `/skill-create` | 从 git 历史生成技能 | skill-creator skill |

### 命令使用场景

```markdown
新功能开发：
1. /plan [feature]       → planner 创建实施计划
2. /tdd [feature]        → tdd-guide 指导 TDD
3. /code-review          → code-reviewer 审查
4. /verify               → 验证循环确认

Bug 修复：
1. /tdd [bug]            → 先写重现测试
2. /build-fix            → 如有构建错误
3. /verify               → 验证修复

重构：
1. /refactor-clean       → refactor-cleaner 清理
2. /code-review          → 审查变更
3. /verify               → 验证

文档更新：
1. /update-docs          → doc-updater 更新
2. /update-codemaps      → 更新代码地图
```

---

## 钩子系统 (Hooks)

### 什么是 Hooks？

Hooks 是基于触发器的自动化，可以在特定事件时执行命令或发送通知。

### Hooks 类型

```markdown
PostToolUse Hooks:
- 工具使用后触发
- 例如：保存文件后自动格式化

PreToolUse Hooks:
- 工具使用前触发
- 例如：执行命令前确认
```

---

## MCP 配置

### MCP 服务器

ECC 包含 14+ MCP 服务器配置：

| MCP | 用途 |
|-----|------|
| Context7 | 文档查询 |
| GitHub | GitHub 操作 |
| GitLab | GitLab 操作 |
| Linear | 项目管理 |
| Notion | 文档管理 |
| Supabase | 数据库 |
| Vercel | 部署 |
| 等 | ... |

---

## 使用工作流

### 标准开发工作流

```
┌─────────────────────────────────────────────────────────────┐
│  1. PLAN 规划                                                │
│     复杂功能 → 使用 planner agent                            │
│     史诗任务 → 使用 blueprint skill                          │
├─────────────────────────────────────────────────────────────┤
│  2. RESEARCH 研究                                            │
│     使用 search-first skill                                  │
│     查找现有工具/库/模式                                     │
├─────────────────────────────────────────────────────────────┤
│  3. TDD 实现                                                 │
│     使用 tdd-guide agent                                     │
│     RED → GREEN → REFACTOR                                   │
├─────────────────────────────────────────────────────────────┤
│  4. REVIEW 审查                                              │
│     使用 code-reviewer agent                                 │
│     解决 CRITICAL/HIGH 问题                                  │
├─────────────────────────────────────────────────────────────┤
│  5. VERIFY 验证                                              │
│     使用 verification-loop skill                             │
│     构建 → 类型 → Lint → 测试 → 安全 → Diff                  │
├─────────────────────────────────────────────────────────────┤
│  6. COMMIT 提交                                              │
│     使用 conventional commits                                │
│     feat: / fix: / refactor: / docs: / test:                 │
└─────────────────────────────────────────────────────────────┘
```

### 决策流程图

```
用户请求
    │
    ▼
是否需要规划？ ──是──> /plan 或 blueprint
    │否
    ▼
是否已存在解决方案？ ──是──> 使用现有方案
    │否
    ▼
是否是 Bug？ ──是──> /tdd (先写测试)
    │否
    ▼
新功能 ──> /tdd (测试驱动开发)
    │
    ▼
代码修改完成 ──> /code-review
    │
    ▼
验证 ──> /verify
    │
    ▼
提交 ──> conventional commit
```

---

## 快速参考

### 常见场景速查表

| 场景 | 使用的组件 |
|------|-----------|
| **新功能开发** | `/plan` → `/tdd` → `/code-review` → `/verify` |
| **Bug 修复** | `/tdd` → `/build-fix` → `/verify` |
| **代码重构** | `/refactor-clean` → `/code-review` → `/verify` |
| **安全审查** | `security-reviewer` agent + `security-review` skill |
| **性能优化** | `performance-optimizer` agent |
| **添加测试** | `tdd-workflow` skill + `e2e-testing` skill |
| **数据库迁移** | `database-migrations` skill + `planner` agent |
| **API 设计** | `api-design` skill + `backend-patterns` skill |
| **部署准备** | `verification-loop` skill + `deployment-patterns` skill |
| **文档更新** | `doc-updater` agent |
| **复杂项目规划** | `blueprint` skill |
| **提示词优化** | `prompt-optimizer` skill |
| **研究先行** | `search-first` skill |
| **Python 项目** | `python-patterns` + `python-testing` + `python-reviewer` |
| **Java 项目** | `springboot-patterns` + `springboot-tdd` + `java-reviewer` |
| **Go 项目** | `golang-patterns` + `golang-testing` + `go-reviewer` |
| **Rust 项目** | `rust-patterns` + `rust-testing` + `rust-reviewer` |
| **前端项目** | `frontend-patterns` + `frontend-design` + `e2e-testing` |

### 成功指标

- ✅ 所有测试通过，覆盖率 80%+
- ✅ 无安全漏洞
- ✅ 代码可读且可维护
- ✅ 性能可接受
- ✅ 满足用户需求

---

## 相关文档

---

*本文档基于 Everything Claude Code v1.10.0 整理*

---
## 关联笔记
- [[AI工程化学习路径]] — 关键词匹配: Agent, Claude, Skills
- [[01-Claude-Code实战-Plan-Mode工作流]] — 关键词匹配: AI, Claude, 教程
- [[03-理解AI-Agent的本质]] — 关键词匹配: 教程, Agent, MCP
- [[04-CrewAI框架入门实战]] — 关键词匹配: AI, 教程, Agent
- [[05-LangGraph状态管理工作流]] — 关键词匹配: Skills, AI, 教程
