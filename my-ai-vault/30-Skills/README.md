# 📁 Skills 资产索引

> 本目录存放可执行的 **Skill**（技能），每个 Skill 是一个完整的 AI 协作工作流。
> 
> **新增 Skill 后请同步更新本索引**，并在 SKILL.md 中维护标准 YAML Frontmatter（`name` / `description` / `trigger`）。

---

## 活跃资产

| 资产名称 | 一句话简介 | 自然语言触发 | 手动调用 | 输入 | 输出 | 状态 |
|---------|-----------|-------------|---------|------|------|:--:|
| **asset-extractor** | 从单条原料（教程/笔记/会话）提取 Prompt/Skill 草稿 | "提炼资产" | `/skill:asset-extractor` | 单条 `.md` 原料 | `待提炼/Prompt-\|Skill-*.md` | ✅ |
| **session-recorder** | 将当前 AI 会话按标准格式归档到 Vault 原料层 | "保存会话" | `/skill:session-recorder` | 当前对话历史 | `会话记录-*.md` | ✅ |
| **weekly-generator** | 按项目聚合会话记录，生成结构化周报 | "生成本周周报" | `/skill:weekly-generator` | 项目下 N 天会话记录 | `周报-*.md` | ✅ |
| **pattern-miner** | 扫描多条会话，发现重复模式并跨案例抽象为通用 Skill | "盘点本周模式" | `/skill:pattern-miner` | 项目下 ≥3 条同类会话 | `待提炼/Skill-*-跨案例抽象.md` | ✅ |

---

## 资产关系图

```
外部教程/笔记 ──→ asset-extractor ──┐
                                    ├──→ 00-Inbox/待提炼/ ──→ 人工确认 ──→ 10-Prompts / 30-Skills
工作会话记录 ────→ session-recorder ──┤      ▲
                         │            │      │
                         └────────────┘      │
                              pattern-miner ←┘
```

**关系说明**：
- `asset-extractor` 处理**外部输入**（单条快速提取）
- `pattern-miner` 处理**内部积累**（多条深度抽象）
- 两者产出都进入 `待提炼/`，经人工确认后迁入资产区
- `session-recorder` 是上游入口，所有工作会话先归档再被 pattern-miner 盘点

---

## 使用决策树

```
想保存当前会话？
  └─ 是 → session-recorder

想从一篇文章/笔记中提取资产？
  └─ 是 → asset-extractor

想盘点近期反复出现的问题模式？
  └─ 是 → pattern-miner

想生成本周工作周报？
  └─ 是 → weekly-generator
```

---

*最后更新: 2026-04-26*
