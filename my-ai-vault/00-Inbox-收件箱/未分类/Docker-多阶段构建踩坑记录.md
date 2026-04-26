---
status: 已提炼
extracted_date: "2026-04-25"
---

# Docker 多阶段构建优化笔记

日期: 2026-04-18
来源: Kimi-Code Session
标签: [devops, docker, ci-cd]

---

## 背景

后端服务镜像从 1.2GB 优化到 87MB 的过程记录。

## 原始 Dockerfile（问题版本）

所有依赖、源码、构建工具都在一个阶段，导致镜像巨大：
- node_modules 占了 800MB+
- 源码、测试文件、构建缓存都没清理
- 基于 full node 镜像而非 alpine

## 优化后的多阶段构建流程

步骤：
1. 用 node:18-alpine 作为 builder 阶段，安装依赖并构建
2. 用 node:18-alpine 作为 production 阶段，只复制 dist 和 package.json
3. 只安装 production 依赖（npm ci --only=production）
4. 用 .dockerignore 排除测试文件、文档、本地配置

具体优化点：
- 基础镜像从 node:18（~900MB）改为 node:18-alpine（~170MB）
- 多阶段构建后最终镜像只包含运行时文件
- 利用 Docker layer cache：把 package.json 复制放在 COPY . 之前
- 使用 BuildKit 的 --mount=type=cache 缓存 npm 缓存

## 完整的优化 Skill

这个流程已经提炼为标准操作：

触发条件：当需要构建 Docker 镜像且镜像体积超过 200MB 时
执行步骤：
1. 检查当前 Dockerfile 是否为单阶段，如果是则改为多阶段
2. 基础镜像改为 alpine 版本
3. 分离 builder 和 production 阶段
4. 用 .dockerignore 排除无关文件
5. 优化 layer cache 顺序
6. 验证构建时间和镜像大小

## 关键数据

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 镜像大小 | 1.2GB | 87MB |
| 构建时间 | 4min 30s | 1min 50s |
| 启动时间 | 8s | 2s |

## 复用建议

这个优化流程适用于所有 Node.js/Python/Go 项目的 Docker 构建。核心思路是：builder 阶段负责编译，production 阶段只保留运行时必需品。
