## 第 7 步：配置、版本号同步与验证

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

### 7.3 同步 Skill 到 AI 工具（版本号管理）

使用版本化同步脚本替代 Junction，确保 Skill 与模板之间的版本一致性：

```powershell
# 运行同步脚本
./my-ai-vault/scripts/sync-skills.ps1
```

**脚本行为**：
- 读取 `my-ai-vault/vault-manifest.json` 中的版本清单
- 对比 `~/.kimi/skills/` 中已安装的 Skill 版本
- 版本号变化时自动覆盖拷贝；版本一致时跳过
- 输出同步报告（Synced / Skipped / Failed）

**何时运行**：
- 首次安装时运行一次
- 每次修改 Skill 后运行一次
- 拉取更新后运行一次

> **为什么不用 Junction**：Junction 依赖文件系统链接，跨环境或权限受限时易失效。版本号方案通过显式清单管理依赖关系，Skill 执行时还会自检模板版本兼容性。

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

**触发**：`提炼会话 @01-Work-工作记录/XX项目/会话记录/xxx.md`

**预期行为**：
1. 读取指定会话记录
2. 调用 LLM 提取 prompt / skill 候选
3. 保存草稿到 `00-Inbox-收件箱/待归档/Prompt-xxx.md`
4. 标记原料 `status: 已提炼`

#### 测试 weekly-generator

**触发**：`生成本周周报`

**预期行为**：
1. 读取 `AGENTS.md` 配置
2. 扫描 `01-Work-工作记录/XX项目/会话记录/` 最近 7 天记录
3. 按维度聚合
4. 选择周报模板
5. 调用 LLM 生成文档
6. 保存到 `01-Work-工作记录/XX项目/文档/XX项目-周报-YYYY-MM-DD.md`

#### 测试 pattern-miner

**触发**：`盘点本周模式`

**预期行为**：
1. 扫描 `01-Work-工作记录/` 下最近 30 天的会话记录
2. 聚类统计，输出重复主题排行榜
3. 用户选择主题后，读取相关会话正文
4. 调用 LLM 跨案例抽象
5. 保存到 `00-Inbox-收件箱/待归档/Skill-{主题}-跨案例抽象.md`
6. 标记关联会话 `pattern_extracted: true`

---

### 7.5 验证清单

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | 目录结构 | `my-ai-vault/` 下 18 个目录全部存在 |
| 2 | Skill 可被识别 | AI 工具能读取 `~/.kimi/skills/` 下各 Skill 目录的 SKILL.md（共 4 个），且 SKILL.md 包含 `version` 字段 |
| 3 | session-recorder | 执行后能在 `会话记录/` 下生成文件 |
| 4 | asset-extractor | 执行后能在 `待归档/` 下生成草稿文件 |
| 5 | weekly-generator | 执行后能在 `文档/` 下生成周报文件 |
| 6 | pattern-miner | 执行后能聚类、抽象并生成跨案例 Skill |
| 7 | 文件完整性 | 所有 Markdown 文件均包含正确的 YAML Frontmatter |
| 8 | 配置持久化 | `AGENTS.md` 中的 `session_archive_path` 在重启后仍可读取 |

---

### 7.6 常见故障排除

#### 问题 1：AI 工具无法识别 Skill

**排查步骤**：
1. 确认已运行同步脚本：`./my-ai-vault/scripts/sync-skills.ps1`
2. 确认 SKILL.md 存在：`Get-ChildItem ~/.kimi/skills/*/SKILL.md`
3. 检查 SKILL.md 是否包含 `version` 和 `template_dependency` 字段
4. 确认文件未被 .gitignore 忽略（检查 `my-ai-vault/` 下无 ignore 规则）
5. 对比 `vault-manifest.json` 与 `~/.kimi/skills/*/SKILL.md` 中的版本号是否一致

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
1. 确认 `01-Work-工作记录/<项目名>/会话记录/` 目录下有 .md 文件
2. 确认时间范围正确（默认最近 7 天）
3. 检查模板文件是否存在
