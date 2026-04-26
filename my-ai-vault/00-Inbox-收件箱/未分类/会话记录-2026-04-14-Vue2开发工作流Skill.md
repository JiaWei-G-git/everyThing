---
date: "2026-04-14 11:20"
type: 会话记录
tags: [vue2, 开发工作流, skill, tdd, plan-mode, kimi-cli]
---

# 会话记录 - Vue2 开发工作流 Skill 创建

## 会话信息
- 日期：2026-04-14 11:20
- 主题：为 Kimi Code CLI 创建全局 Vue2 前端开发工作流 Flow Skill，并与 Plan 模式结合
- 使用的工具/技能/代理：WriteFile、ReadFile、Shell、FetchURL、kimi-cli-help Skill

## 主要内容
- 用户希望建立一套通用的 Vue2 前端开发工作流，包含需求分析、TDD 测试先行、编码实现、Code Review、功能自测、问题修改、回归测试
- 强调工作流不应绑定特定项目，而应通过 AGENTS.md 先做项目适配，再本地化落地
- 我们一起设计了一套 8 阶段工作流：项目适配 → 需求拆分 → Plan 方案设计 → TDD 先行 → 编码实现 → 本地自测 → Code Review → 修复回归
- 将工作流固化为 Kimi Code CLI 的 Flow Skill，存储在全局 Skills 目录 `~/.kimi/skills/vue2-dev/SKILL.md`
- 后续将 Plan 模式整合进工作流，使其成为编码前的强制审批门槛

## 最终成果
- 创建了全局 Flow Skill：`C:\Users\LS\.kimi\skills\vue2-dev\SKILL.md`
- 可通过 `/flow:vue2-dev` 在任何 Vue2 项目中一键执行完整开发工作流
- 也可通过 `/skill:vue2-dev` 加载为普通 Skill 查看规范
- Plan 模式被设计为编码前的必经步骤，用户审批通过后方可进入 TDD 和编码阶段

## 优化建议

### 提示词优化
| 原始提问 | 优化版本 | 优化原因 |
|----------|----------|----------|
| "可以把这个工作流添加到斜杠命令里吗 全局的kimi code 中" | "帮我把上面这套 Vue2 开发工作流做成 Kimi CLI 全局可用的 Flow Skill，支持 `/flow:vue2-dev` 调用" | 更直接、使用准确的术语（Flow Skill），减少解释成本 |
| "可以加上和plan 模式结合" | "在阶段3增加 Plan 模式：编码前必须通过 `/plan` 输出技术方案并经我审批" | 明确具体阶段和要求，Agent 执行更精准 |

### 工作流建议
- **是否有重复操作可做成 skill/脚本**：
  - 每次结束会话生成会话记录（已有 `session-recorder` Skill）
  - 新项目接入时的 15 分钟适配扫描（可拆分为独立的 `/flow:project-scan` Skill）
- **建议的自动化方案**：
  - 在 `vue2-dev` 工作流中，项目适配阶段可以进一步标准化为固定检查清单，Agent 自动执行并输出表格

### 知识沉淀
- **值得整理到知识库的内容**：
  - Vue2 项目通用的 TDD 测试基建配置（`jest.config.js`、`tests/unit/setup.js`、Cypress 配置）
  - 企业级 Vue2 项目的 Code Review Checklist 模板
- **建议存放位置**：
  - `60-Tutorials-教程/Skill创建与使用/` 或 `01-Work-工作笔记/前端开发规范/`

## 关联文档
- [[会话记录-2026-04-10-创建会话提取Skill]]
- [[01-为什么要Skill]]
- [[02-Skill创建指南]]
- `C:sersS.kimiskillsvue2-devSKILL.md`
