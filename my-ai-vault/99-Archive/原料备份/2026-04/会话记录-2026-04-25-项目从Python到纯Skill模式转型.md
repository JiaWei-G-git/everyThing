---
project: "aiKnowledgeBase"
date: "2026-04-25 14:00"
topic: "项目从 Python 模式到纯 Skill 模式转型"
source: "Kimi-Code"
tags: [refactoring, skill-only, architecture]
status: active
pattern_extracted: true
pattern_id: "项目架构设计与转型-2026-04-26"
pattern_sessions: 4
archived: true
archive_date: "2026-04-26"
original_path: "my-ai-vault\01-Work-工作记录\aiKnowledgeBase\会话记录\会话记录-2026-04-25-项目从Python到纯Skill模式转型.md"
---

# 会话记录 - 项目从 Python 模式到纯 Skill 模式转型

## 背景

最初设计是 Python CLI + Skill 双轨驱动。但实践发现：不同 AI 工具的 Python 环境差异大、API Key 配置麻烦、跨工具体验不统一。经过讨论，决定完全去掉 Python，改为纯 Skill 模式。

## 用户提示词序列

```
[1] 去掉 python 模式吧，目前只使用 skill 就行了，就不需要在配置 .env 之类的了吧

[2] 项目中也不需要了

[3] 所有的安装方式脚本之类的都改为提示词提交给 ai 的方式

[4] skill 里面还有包含 py 的内容 mock 也不需要了，查询项目所有文件进行清理

[5] 清理完之后查看文档和 skill 是否有缺陷

[6] 我想的安装 skill 是要满足项目的，直接把 ai 工具的 skill 链接到知识库的 30-skill 中
```

## 解决思路

**删除的文件**：
- `src/` 整个目录（config.py, utils.py, vault_initializer.py, session_recorder.py, asset_extractor.py）
- `requirements.txt`
- `.env.example`
- `test_api.py`, `test_session.py`
- `docs/superpowers/plans/` 过时的 Python 实施计划

**Skill 清理**：
- 去掉所有 `python -m`、`pip install`、`--mock` 引用
- 去掉 `sanitize_filename` 等函数名引用
- 去掉"脚本"描述，统一改为"Skill"

**安装方式转型**：
- 旧：`ln -s` / `New-Item` 脚本命令
- 新：对 AI 说"请将 30-Skills/ 下的 Skill 以符号链接安装到你的 Skill 目录中"

**核心原则保留**：
- `30-Skills/` 是唯一来源
- 符号链接确保修改一处、全局生效
- 版本一致性由 Git 管理

## 优化经验

1. **统一安装方式**的决策很重要。`ln -s` / `New-Item` 等脚本在不同操作系统和 AI 工具差异太大。改为"对 AI 说一句话"后，跨工具体验统一了
2. **符号链接的核心设计不能丢**。虽然不让用户手动执行脚本，但"30-Skills 是唯一来源"这个原则要明确告诉 AI
3. **PROJECT_GENERATOR.md 需要包含所有文件内容**，不能只是文件列表。这样任何 AI 拿到这份文档都能完整重建项目
4. 清理时要全文搜索，docs/ 目录下的历史文档、PROJECT_GENERATOR.md 里的文件副本、Git 忽略规则，都要逐一检查
5. 历史文档（架构文档、PRD）中的技术实现描述也要同步更新，避免新旧信息矛盾

## 关联笔记
- [[三个 Core Skill 的创建]]
- [[生成测试数据与周报模板]]
