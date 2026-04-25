---
project: "CI/CD 流水线"
date: "2026-04-25"
topic: "Docker 镜像构建优化"
source: "Kimi-Code-Session"
tags: [devops, docker]
status: active
---

# 会话记录 - Docker 镜像构建优化

## 背景
Docker 构建时间太长，每次部署要等 10 分钟。

## Prompt
```
我的 Dockerfile 构建很慢，如何优化？
当前是多阶段构建，但层缓存似乎没有生效。
```

## 解决思路
AI 指出：
1. 依赖安装层应该在代码复制层之前
2. 使用 .dockerignore 排除 node_modules
3. 考虑使用 BuildKit 的并行构建

## 优化经验
Dockerfile 的指令顺序直接影响缓存命中率。不常变的放前面，常变的放后面。
