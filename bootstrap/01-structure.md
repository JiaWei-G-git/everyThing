## 第 1 步：创建目录结构

创建以下目录（所有路径相对于项目根目录）：

```
my-ai-vault/
├── 00-Inbox-收件箱/
│   ├── 待提炼/
│   └── 未分类/
├── 01-Work-工作记录/
├── 10-Prompts/
├── 20-Agents/
├── 30-Skills/
│   ├── session-recorder/
│   ├── asset-extractor/
│   ├── weekly-generator/
│   └── pattern-miner/
├── 40-MCP/
├── 50-Workflows-工作流/
├── 60-Tutorials-教程/
├── 70-Sharing-团队共享/
├── 90-Templates/
│   └── 周报/
└── 99-Archive/
    └── 资产版本历史/
```

**PowerShell 创建命令**：

```powershell
$dirs = @(
    "my-ai-vault/00-Inbox-收件箱/待提炼",
    "my-ai-vault/00-Inbox-收件箱/未分类",
    "my-ai-vault/01-Work-工作记录",
    "my-ai-vault/10-Prompts",
    "my-ai-vault/20-Agents",
    "my-ai-vault/30-Skills/session-recorder",
    "my-ai-vault/30-Skills/asset-extractor",
    "my-ai-vault/30-Skills/weekly-generator",
    "my-ai-vault/30-Skills/pattern-miner",
    "my-ai-vault/40-MCP",
    "my-ai-vault/50-Workflows-工作流",
    "my-ai-vault/60-Tutorials-教程",
    "my-ai-vault/70-Sharing-团队共享",
    "my-ai-vault/90-Templates/周报",
    "my-ai-vault/99-Archive/资产版本历史"
)
foreach ($d in $dirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
```
