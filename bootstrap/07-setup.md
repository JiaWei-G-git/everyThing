## 第 7 步：配置、Junction 安装与验证

### 7.1 AGENTS.md（项目根目录）

**写入规则**：
- 如文件已存在，**覆盖整个文件**，只保留以下内容
- 如文件不存在，新建

**`AGENTS.md` 的完整内容**：

<!-- AI-Vault-Config -->
- session_archive_path: "01-Work-工作记录/XX项目/会话记录"

### 7.2 .gitignore（项目根目录）

**写入规则**：
- 如文件已存在，**覆盖整个文件**，只保留以下内容
- 如文件不存在，新建

**`.gitignore` 的完整内容**：

# IDE
.vscode/
.idea/

# 环境
.env
.env.local

# 系统文件
.DS_Store
Thumbs.db

---

### 7.3 创建技能入口（Windows Junction）

在 Kimi Code / Cursor 等 AI 工具中，执行以下命令（PowerShell）：

```powershell
# 检查 skills 目录是否存在
$skillsDir = "$env:USERPROFILE\.kimi\skills"
if (-not (Test-Path $skillsDir)) {
    New-Item -ItemType Directory -Path $skillsDir -Force
}

# 为 30-Skills 下的每个子目录创建 Junction
$sourceDir = "$PWD\my-ai-vault\30-Skills"
Get-ChildItem $sourceDir -Directory | ForEach-Object {
    $target = Join-Path $skillsDir $_.Name
    if (Test-Path $target) {
        Remove-Item $target -Recurse -Force
    }
    New-Item -ItemType Junction -Path $target -Target $_.FullName | Out-Null
    Write-Host "✅ Junction: $target -> $($_.FullName)"
}
```

> **注意**：不要使用 Windows 快捷方式（.lnk），AI 工具扫描目录时会跳过 `.lnk` 文件，导致 Skill 无法被识别。必须使用 `New-Item -ItemType Junction` 创建目录联结。

---

### 7.4 验证端到端流程

#### 测试 session-recorder

**触发**：在 AI 对话中输入 `保存本次会话`

**预期行为**：
1. AI 读取 `AGENTS.md` 中的 `session_archive_path`
2. 从当前对话中提取主题、有效提示词、解决思路
3. 渲染 `session_record.md` 模板
4. 保存到 `01-Work-工作记录/XX项目/会话记录/会话记录-YYYY-MM-DD-{主题}.md`
5. 通知用户保存路径

#### 测试 asset-extractor

**触发**：`提炼会话 @01-Work/XX项目/会话记录/xxx.md`

**预期行为**：
1. 读取指定会话记录
2. 调用 LLM 提取 prompt / skill 候选
3. 保存草稿到 `00-Inbox-收件箱/待提炼/Prompt-xxx.md`
4. 标记原料 `status: 已提炼`

#### 测试 weekly-generator

**触发**：`生成本周周报`

**预期行为**：
1. 读取 `AGENTS.md` 配置
2. 扫描 `01-Work-XX项目/会话记录/` 最近 7 天记录
3. 按维度聚合
4. 选择周报模板
5. 调用 LLM 生成文档
6. 保存到 `01-Work-工作记录/XX项目/文档/XX项目-周报-YYYY-MM-DD.md`

#### 测试 pattern-miner

**触发**：`盘点本周模式`

**预期行为**：
1. 扫描 `01-Work/` 下最近 30 天的会话记录
2. 聚类统计，输出重复主题排行榜
3. 用户选择主题后，读取相关会话正文
4. 调用 LLM 跨案例抽象
5. 保存到 `00-Inbox-收件箱/待提炼/Skill-{主题}-跨案例抽象.md`
6. 标记关联会话 `pattern_extracted: true`

---

### 7.5 验证清单

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 目录结构 | `my-ai-vault/` 下 18 个目录全部存在 |
| 2 | Skill 可被识别 | AI 工具能读取 `~/.kimi/skills/` 下各 Skill 目录的 SKILL.md（共 4 个） |
| 3 | session-recorder | 执行后能在 `会话记录/` 下生成文件 |
| 4 | asset-extractor | 执行后能在 `待提炼/` 下生成草稿文件 |
| 5 | weekly-generator | 执行后能在 `文档/` 下生成周报文件 |
| 6 | pattern-miner | 执行后能聚类、抽象并生成跨案例 Skill |
| 7 | 文件完整性 | 所有 Markdown 文件均包含正确的 YAML Frontmatter |
| 8 | 配置持久化 | `AGENTS.md` 中的 `session_archive_path` 在重启后仍可读取 |

---

### 7.6 常见故障排除

#### 问题 1：AI 工具无法识别 Skill

**排查步骤**：
1. 确认 Junction 已创建：`Get-ChildItem ~/.kimi/skills`（应显示各 Skill 目录，Mode 含 `l`）
2. 确认 SKILL.md 存在：`Get-ChildItem ~/.kimi/skills/*/SKILL.md`
3. 确认文件未被 .gitignore 忽略（检查 `my-ai-vault/` 下无 ignore 规则）

#### 问题 2：session-recorder 无法找到归档路径

**排查步骤**：
1. 检查 `AGENTS.md` 格式是否包含 `<!-- AI-Vault-Config -->` 标记
2. 检查 `session_archive_path` 中的路径是否存在
3. 若路径不存在，Skill 会退回交互式选择

#### 问题 3：pattern-miner 无法聚类

**排查步骤**：
1. 确认会话记录包含标准 YAML Frontmatter（project, topic, tags, date）
2. 确认聚类规则：topic 共享核心词 / tags 重叠 ≥2 / 文件名含相同关键词
3. 若所有主题均只出现 1 次，会提示"无重复模式"，需积累更多记录

#### 问题 4：weekly-generator 输出为空

**排查步骤**：
1. 确认 `01-Work/<项目名>/会话记录/` 目录下有 .md 文件
2. 确认时间范围正确（默认最近 7 天）
3. 检查模板文件是否存在
