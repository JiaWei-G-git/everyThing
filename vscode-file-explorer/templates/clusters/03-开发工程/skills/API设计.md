---
name: "API设计"
description: "设计RESTful API接口规范"
type: "skill"
version: "1.0.0"
date: "2026-04-30"
parent-agent: "架构设计智能体"
standalone: true
tags: ["开发", "API", "后端"]
input: "功能点清单或需求文档"
output: "完整的API接口规范文档（含URL、方法、参数、响应）"
estimated-time: "30-60分钟"
scenarioTags: [写代码, 做设计]
---

# 技能：API设计

## 适用场景

✅ **适合使用**：
- 需要设计后端接口规范时
- 前后端协作需要统一定义时

## 输入

- 功能点清单
- 数据模型（如有）
- 安全需求

## 输出

API 接口规范文档，包含：接口列表、请求/响应格式、错误码、认证方式。

## Prompt 模板

```
你是一名资深后端架构师，擅长设计高质量的 RESTful API。

## 功能需求
{粘贴功能点清单}

## 数据模型
{粘贴数据模型（如有）}

## 任务
请设计完整的 API 接口规范，要求：
1. 遵循 RESTful 设计原则
2. 每个接口包含：URL、HTTP方法、请求参数、响应格式、错误码
3. 考虑分页、过滤、排序等常见需求
4. 标注需要认证的接口

## 输出格式
用 Markdown 表格和代码块输出，格式清晰易读。
```

## 独立安装说明

### Claude Code
复制本文件到 `~/.claude/skills/API设计.md`

### Cursor
复制 Prompt 模板到对话中使用。

### 通用
直接复制 Prompt 模板，替换占位符后发送给 AI。
