---
project: "aiKnowledgeBase"
date: "2026-04-26 10:45"
topic: "pattern-miner 盘点与 asset-extractor 双模式验证"
source: "Kimi-Code-Session"
tags: [pattern-miner, asset-extractor, skill, vault, session-recorder]
status: active
---

# 会话记录 - pattern-miner 盘点与 asset-extractor 双模式验证

## 背景

用户通过发送完整的 `pattern-miner` 和 `asset-extractor` SKILL.md 内容，触发了两次 Skill 执行。第一次执行 pattern-miner 全量盘点并生成跨案例抽象草稿，随后对草稿质量进行评估；第二次验证 asset-extractor 是否支持批量扫描与指定文件两种模式，发现原 Skill 缺少方式分支逻辑，进行了修正并演示了两种方式。

## 用户提示词序列

```
[1] 发送 pattern-miner 完整 SKILL.md（触发盘点本周模式）

[2] 目前提炼出来的 skill 可以直接使用吗

[3] 发送 asset-extractor 完整 SKILL.md（触发资产提炼验证）

[4] asset-extractor 应该支持批量和单独某个文件的提取

[5] 我直接输入 提炼 @my-ai-vault\00-Inbox-收件箱\未分类\ECC-使用指南.md 这种可以执行这个 skill 吗

[6] 保存本次会话（触发 session-recorder）
```

## 解决思路

**pattern-miner 执行**：
1. 扫描 `01-Work-工作记录/` 下全部 21 条会话记录，排除已标记 `pattern_extracted` 的 4 条
2. 读取 17 条有效记录的 YAML Frontmatter，提取 topic/tags/project 进行语义聚类
3. 聚类结果：前端组件库建设(3)、订单系统后端优化(3)、客户A系统对接交付(3)、Vault知识库架构(3)、Skill工程化(2)
4. 用户选择主题 1/2/3，读取 9 条记录正文进行跨案例抽象
5. 产出 5 个草稿文件（3 Skill + 2 Prompt），标记 9 条记录 `pattern_extracted: true`，更新 `pattern_miner_last_scan`

**pattern-miner 草稿质量评估**：
- 指出草稿是「有结构的骨架」，基于示例/测试数据生成，缺少真实踩坑细节
- 建议转正流程：替换示例数据 → 补充真实经验 → 试用验证 → 更新索引
- 明确告知可直接试用但不建议直接作为生产级 Skill

**asset-extractor 双模式修正**：
1. 分析原 SKILL.md：步骤 1 列出了方式 A/方式 B，但后续步骤未区分分支
2. 补充「执行方式判断表」：根据用户输入特征（是否含文件路径/@）自动判断方式
3. 明确方式 A 跳过预筛选、方式 B 执行预筛选
4. 明确方式 A 仅标记指定文件、方式 B 标记全部通过文件
5. 同步更新 `30-Skills/asset-extractor/SKILL.md` 和 `bootstrap/04-asset-extractor.md`

**asset-extractor 批量扫描演示（方式 B）**：
1. 扫描 `01-Work/` 下未标记的会话记录，排除 `status: 已提炼` 和 `pattern_extracted: true`
2. 7 条记录通过预筛选，LLM 提取出 7 条资产（4 Prompt + 3 Skill）
3. 标记 7 条原料 `status: 已提炼`

**asset-extractor 指定文件演示（方式 A）**：
1. 用户指定 `ECC-使用指南.md`，方式 A 跳过预筛选直接读取（986 行）
2. LLM 提取 5 条资产（3 Prompt + 2 Skill）：AI编程规范体系、代码审查清单、TDD工作流、ECC标准开发工作流、ECC代码审查流程
3. 原料无 Frontmatter，无需标记 status

## 优化经验

1. **pattern-miner 的聚类质量受原始数据影响大** —— 示例/测试数据生成的草稿骨架完整但缺少真实踩坑细节，必须经人工审阅、注入真实项目经验后才能转正
2. **asset-extractor 必须在步骤层面区分方式 A / 方式 B** —— 否则会出现"指定文件仍被预筛选跳过"或"批量扫描误标记范围错误"的问题；修正后在步骤 1、2.1、5 均增加了分支逻辑
3. **PowerShell 中文编码问题在 Vault 扫描中反复出现** —— 必须始终设置 `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`，否则路径匹配和状态标记会失效
4. **StrReplaceFile 做局部修改优于 WriteFile 整文件重写** —— 批量修正 4 个 Skill 文件时，精确匹配旧字符串替换风险更低，且能保持文件其他部分不变
5. **用户通过发送完整 SKILL.md 内容触发 Skill 执行是有效交互模式** —— AI 应识别内容意图（如包含"盘点本周模式"关键词或 Skill 定义）并正确匹配执行
6. **会话记录保存的 Frontmatter 必填校验很重要** —— 6 个字段（project/date/topic/source/tags/status）缺一不可，缺失时自动填充默认值并提示用户

## 关联笔记

- `docs/superpowers/Skill-Brainstorming-分析.md` — 本次修改的问题来源和分析依据
- `my-ai-vault/30-Skills/pattern-miner/SKILL.md` — pattern-miner 技能定义
- `my-ai-vault/30-Skills/asset-extractor/SKILL.md` — asset-extractor 技能定义（已修正双模式逻辑）
- `my-ai-vault/00-Inbox-收件箱/待提炼/` — 本次产出的 12 个草稿文件（5 来自 pattern-miner + 7 来自 asset-extractor）
