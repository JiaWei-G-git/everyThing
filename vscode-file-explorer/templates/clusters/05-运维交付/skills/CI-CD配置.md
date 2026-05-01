---
name: "CI-CD配置"
description: "配置持续集成与持续交付流水线"
type: "skill"
version: "1.0.0"
date: "2026-04-30"
parent-agent: "部署智能体"
standalone: true
tags: ["运维", "CI/CD", "DevOps"]
input: "项目信息（技术栈、部署目标、分支策略）"
output: "完整的CI/CD配置文件（GitHub Actions/GitLab CI等）"
estimated-time: "20-40分钟"
---

# 技能：CI-CD配置

## 适用场景

✅ **适合使用**：
- 新项目需要搭建CI/CD流水线
- 现有流水线需要优化

## 输入

- 项目技术栈
- 部署目标（服务器/容器/云）
- 分支策略

## 输出

CI/CD 配置文件（YAML格式），包含：构建、测试、打包、部署阶段。

## Prompt 模板

```
你是一名DevOps专家，擅长配置高效的CI/CD流水线。

## 项目信息
- 技术栈：{如 Node.js, React, PostgreSQL }
- 部署目标：{如 AWS ECS, 自建K8s }
- 分支策略：{如 Git Flow, Trunk-based }

## 任务
请生成完整的 CI/CD 配置文件，包含：
1. 代码提交触发构建
2. 自动化测试（单元测试、集成测试）
3. 代码质量检查（lint, format）
4. 构建 Docker 镜像
5. 部署到测试环境
6. 部署到生产环境（需审批或条件触发）

## 输出格式
输出完整的 YAML 配置文件，附带关键步骤的注释说明。
```

## 独立安装说明

### Claude Code
复制本文件到 `~/.claude/skills/CI-CD配置.md`

### Cursor
复制 Prompt 模板到对话中使用。

### 通用
直接复制 Prompt 模板，替换占位符后发送给 AI。
