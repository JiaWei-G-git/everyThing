# 资产提炼技能 (Asset Extractor)

**版本**: v1.0.0
**类型**: Skill · 知识资产提炼器

当用户说 **"提炼资产"**、**"提取 Prompt/Skill"** 或 **"/extract"** 时触发此技能。

---

## 功能说明

从 Vault 原料层（`00-Inbox` / `01-Work`）的工作记录中，调用 LLM 提取可复用的知识资产草稿，输出到 `00-Inbox-收件箱/待提炼/` 等待人工确认。

---

## 执行步骤

### 1. 确定输入原料

**方式 A — 指定文件**：
用户提供原料文件路径，如：
- `01-Work-工作记录/XX项目/会话记录/会话记录-2026-04-25-接口优化.md`

**方式 B — 批量扫描**：
扫描 `00-Inbox` 和 `01-Work` 下所有新增/未提炼的 `.md` 文件，排除已标记 `status: 已提炼` 的原料。

### 2. 读取原料内容

读取原料文件的完整 Markdown 内容，作为 LLM 分析的输入。

### 3. 调用 LLM 提取资产

发送提炼指令 + 原料内容给 LLM，要求识别并提取以下 6 类资产：

| 资产类型 | 目标目录 |
|---------|---------|
| 优质 Prompt | `10-Prompts/` |
| 角色定义与交互流程 | `20-Agents/` |
| 原子 Skill | `30-Skills/` |
| MCP 服务定义 | `40-MCP/` |
| 多步骤工作流 | `50-Workflows/` |
| 工具使用经验与教程 | `60-Tutorials/` |

**LLM 输出格式要求**（JSON 数组）：
```json
[
  {
    "type": "prompt|skill|agent|mcp|workflow|tutorial",
    "name": "简短命名",
    "scenario": "使用场景",
    "content": "具体内容",
    "confidence": "high|medium|low"
  }
]
```

### 4. 渲染草稿并保存

将 LLM 返回的资产渲染为标准 Markdown 草稿，保存到：

```
00-Inbox-收件箱/待提炼/Prompt-{名称}.md
00-Inbox-收件箱/待提炼/Skill-{名称}.md
```

**Prompt 草稿模板**：使用 `templates/prompt_asset.md`，包含：
- title, category, source, extracted_date, applicable_scenario, maturity: draft

**Skill 草稿模板**：内联生成，包含：
- type: skill_candidate, name, source, extracted_date, status: draft
- 触发条件 / 执行步骤

### 5. 标记原料状态

对已完成提炼的原料，在 YAML Frontmatter 中更新 `status: 已提炼`（原料文件本身保留不删除）。

### 6. 输出提炼摘要

向用户汇报：
- 处理了多少条原料
- 提取了多少条候选资产
- 候选资产列表及建议归属目录
- 提醒用户前往 `待提炼/` 目录审阅

---

## Mock 模式（LLM 不可用时）

当 LLM API 调用失败（如额度不足、网络超时），可启用 `--mock` 参数：

```bash
python -m src.asset_extractor --mock
```

Mock 模式基于关键词匹配返回模拟资产，用于演示和无网络环境测试。

---

## 核心规则（不可违反）

1. **只产出草稿，不直接写入资产区** — 所有 LLM 提取结果必须进入 `待提炼/`，经人工确认后才可迁移；
2. **资产来源可追溯** — 每条草稿必须标注 `source`（来源原料文件路径）；
3. **原料不删除** — 提炼后原料保留，仅更新 `status` 标签；
4. **支持空产出** — 如原料质量不足，允许返回空数组，不强行凑数；
5. **异常回退** — LLM 调用失败时保留原始原料，记录错误日志。

---

## 使用示例

**用户**: "提炼这份会话记录 @01-Work/XX项目/会话记录/xxx.md"

**执行**:
1. 读取指定原料文件；
2. 调用 LLM 分析并提取资产；
3. 渲染草稿并保存到 `00-Inbox-收件箱/待提炼/`；
4. 更新原料状态为 `已提炼`；
5. 向用户汇报提炼结果。

---

## 版本信息

- **当前版本**: v1.0.0
- **支持资产类型**: prompt, skill, agent, mcp, workflow, tutorial
- **支持模式**: 真实 LLM / Mock 回退
