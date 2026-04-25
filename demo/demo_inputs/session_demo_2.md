---
project: "管理后台"
date: "2026-04-25"
topic: "封装通用表格组件"
source: "Claude-Code-Session"
tags: [frontend, component]
status: active
---

# 会话记录 - 封装通用表格组件

## 背景
项目中多个页面都有表格，每次复制粘贴改参数，容易出 bug。

## Prompt
```
请帮我设计一个 Vue3 的通用表格组件，支持：
- 分页
- 排序
- 列配置化
- 操作按钮插槽
```

## 解决思路
AI 给出了基于 slot 和 props 的设计方案，支持 column 配置数组传入，复用性很高。

## 优化经验
组件设计时先定义 props 接口，再写模板。props 命名要和使用方一致，降低理解成本。
