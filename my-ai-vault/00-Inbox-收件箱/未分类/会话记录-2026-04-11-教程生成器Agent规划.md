---
date: "2026-04-11 22:17"
type: 会话记录
tags: [agent, 教程生成器, tutorial-writer, claude-code, 资产复用]
---

# 会话记录 - 教程生成器 Agent 规划与安装

## 会话信息
- 日期:2026-04-11 22:17 ~ 22:18(极短,仅 1 条用户消息,主要是规划启动)
- 主题:基于 vault 内已有的 `20-Agents-代理/教程生成器/` 资产,规划一个同等能力的 agent 并安装到 Claude Code
- 使用的工具/技能/代理:Bash, Read

## 主要内容
- 用户提出需求:"帮我规划 @20-Agents-代理\教程生成器\    我想创建个同样的 agent  安装到 claude 中"
- 意图解析:把 vault 里已整理成形的"教程生成器"资产(应为一份 prompt + 工作流说明)转化为 Claude Code 可直接调用的 agent 定义文件,装入 `~/.claude/agents/`
- 会话在规划阶段因 `prompt_input_exit` 结束,未完成实际安装动作

## 最终成果
- ⚠️ 未产出实际文件(会话被中断)
- ✅ 明确了下一步方向:读取 `20-Agents-代理/教程生成器/` 原始资产 → 转换为 `~/.claude/agents/tutorial-writer.md` frontmatter 格式 → 写入并测试调用
- 📌 该未竟任务已在下一会话(2026-04-11 夜间)中实际被推进 —— tutorial-writer agent 已在新会话中被调用生成《Claude Code 使用指南》系列教程,说明资产转换已经完成

## 优化建议

### 提示词优化
| 原始提问 | 优化版本 | 优化原因 |
|----------|----------|----------|
| "帮我规划 @20-Agents-代理\教程生成器\  我想创建个同样的 agent 安装到 claude 中" | "请读取 `20-Agents-代理\教程生成器\` 下所有文件,分析其 Prompt 结构和工作流,然后生成一份符合 Claude Code agent 规范(frontmatter: name/description/tools/model)的 `.md` 文件,建议路径 `~/.claude/agents/tutorial-writer.md`,完成后告诉我如何触发它" | 原句只说"规划"和"安装",动词模糊;优化版明确了读取路径、输出格式、目标路径、验收标准,agent 无需追问即可执行 |

### 工作流建议
- **重复操作**:"把 vault 内 20-Agents-代理/xxx 转换成 ~/.claude/agents/xxx.md" 这个操作未来会反复做,值得沉淀成一个 skill:`agent-install`,输入 vault 资产目录 → 输出标准 agent 定义文件
- **自动化**:在 `20-Agents-代理/` 每个子目录内约定一个 `install.json`,标记目标路径和元数据,脚本一键同步到 `~/.claude/agents/`
- **双向同步**:如果 Claude Code 的 agent 定义修改了,如何回流到 vault?建议写一个 `30-Skills-技能/agent-sync/` 的同步脚本

### 知识沉淀
- 本次交互揭示了 vault 资产层(`20-Agents-代理/`)与 Claude Code 运行层(`~/.claude/agents/`)之间缺少自动化桥梁,值得在 `60-Tutorials-教程/Claude-Code-使用指南/` 的"团队协作与落地"章节里单开一节"资产同步:从 vault 到 ~/.claude/"
- 本次未完成 = 下次 tutorial-writer 实际被调用,证明资产→agent 的转换路径走通了,这段"走通"的过程本身应该作为案例归档

## 关联笔记
- [[会话记录-2026-04-11-会话提炼与插件盘点]] — 同日上一会话,是本会话的前置(那次盘点完组件,这次开始新增)
- [[Claude-Code-使用指南]] — 本会话未竟的任务在下一会话中通过 tutorial-writer 实际产出
- [[知识库架构与流转流程-2026-04-10]] — 资产层目录结构的源头决策
