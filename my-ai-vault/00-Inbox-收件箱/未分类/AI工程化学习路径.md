# AI学习路径规划（优化版）

> AI工程化开发者成长指南  
> 从AI编程工具到Agent开发 · 从Skills到Harness工程
> 
> 📌 **适用版本**：2025年4月 | **预计学习周期**：12周 | **文档状态**：已优化（含代码示例与验收标准）

---

## 目录

1. [学习定位分析](#学习定位分析)
2. [第一阶段：AI编程工具进阶（1-2周）](#第一阶段ai编程工具进阶1-2周)
3. [第二阶段：AI Agent开发入门（2-4周）](#第二阶段ai-agent开发入门2-4周)
4. [第三阶段：Skills开发（1.5周）](#第三阶段skills开发15周)
5. [第四阶段：MCP协议开发（1.5周）](#第四阶段mcp协议开发15周)
6. [第五阶段：Harness工程开发（3-4周）](#第五阶段harness工程开发3-4周)
7. [第六阶段：AI本地化与记忆系统（扩展选修）](#第六阶段ai本地化与记忆系统扩展选修)
8. [推荐工具栈](#推荐工具栈)
9. [学习资源推荐](#学习资源推荐)
10. [避坑指南](#避坑指南)
11. [立即行动计划](#立即行动计划)

---

## 学习定位分析

### 目标定位

根据你的背景和目标，你属于**"AI工程化开发者"**路线：

| 不是 | 而是 |
|------|------|
| 算法研究 | AI工具进阶使用 |
| 数学推导 | Agent开发 |
| 模型训练 | Skills开发 |
| | Harness工程 |

**核心目标**：提升开发效率 + 构建AI应用系统

### 技术背景匹配

| 背景 | 说明 |
|------|------|
| **编程基础** | Java、JavaScript基础，无需担心语言切换 |
| **数学基础** | 无要求，工程化方向不需要深入数学 |
| **AI经验** | 使用过Kimi Code、Claude Code，有初步认知 |
| **目标方向** | AI工程化：Agent、Skills、Harness、本地记忆 |

---

## 第一阶段：AI编程工具进阶（1-2周）

> **目标**：把Claude Code、Cursor等工具用到极致，提升日常开发效率
> 
> ✅ **阶段验收**：使用 Plan Mode 完成 3 次开发任务，CLAURO.md 配置生效

### Claude Code 进阶技巧

1. **探索-规划-编码工作流**  
   使用 `Plan Mode`（Shift+Tab）减少65%返工率

2. **批量处理**  
   使用 `/batch` 进行多Agent并行开发

3. **并行开发**  
   Git Worktrees做并行开发

4. **自定义Agent**  
   使用 `--agent` 参数配置专业Agent

5. **语音输入**  
   使用 `/voice` 提升效率

### Cursor 高级功能

1. **Tab补全** - 精准使用Tab补全，减少重复输入
2. **Composer** - 多文件编辑，批量修改
3. **Agent模式** - 调节自主性，平衡效率与可控性
4. **工具组合** - Cursor + Claude Code协同使用策略

### AI编程工具对比

| 工具 | 成本 | 适用场景 |
|------|------|----------|
| **Claude Code** | $20/月 | 复杂任务、多文件重构、架构设计 |
| **Cursor** | $20/月 | 日常编码、Tab补全、快速编辑 |
| **Kimi Code** | 免费/按需 | 国内替代、中文场景 |
| **GitHub Copilot** | $10/月 | 内联补全、GitHub生态 |

**建议组合**：Cursor（日常）+ Claude Code（复杂任务）= $40/月

### 📝 阶段一验收清单

- [ ] 成功安装并配置 Claude Code
- [ ] 创建至少 1 个 CLAUDE.md 上下文文件
- [ ] 使用 Plan Mode 完成 3 次真实开发任务
- [ ] 熟练使用 `/batch` 或 Git Worktrees 进行并行开发

---

## 第二阶段：AI Agent开发入门（2-4周）

> **目标**：理解Agent原理，能开发简单Agent应用
> 
> ✅ **阶段验收**：独立运行一个 Agent 项目，能调用至少 2 个工具

### Agent基础概念

- **Agent vs 传统程序**：自主决策、工具调用、记忆系统
- **记忆系统**：短期记忆、长期记忆、向量记忆
- **工具调用（Tools）**：MCP协议、Function Calling
- **Agent架构演进**：Workflow → Agent → While Loop

### 主流框架体验（含新手推荐顺序）

> 💡 **新手建议路径**：CrewAI（易上手）→ LangGraph（复杂工作流）

| 框架 | 特点 | 适用场景 | 新手推荐度 |
|------|------|----------|-----------|
| **CrewAI** | 角色扮演、API简洁 | 团队协作、角色分工场景 | ⭐⭐⭐⭐⭐ |
| **LangGraph** | 状态管理强 | 复杂工作流、需要状态追踪 | ⭐⭐⭐⭐ |
| **AutoGen** | 微软出品 | 多Agent协作、对话型应用 | ⭐⭐⭐ |
| **OpenAI Swarm** | 轻量级 | 简单多Agent编排 | ⭐⭐⭐ |

### 第一个Agent项目：代码审查Agent

**项目要求**：
- 集成文件读取工具
- 集成代码执行工具
- 输出结构化审查报告

**最小可运行示例（CrewAI）**：

```python
# code_reviewer_agent.py
from crewai import Agent, Task, Crew
from langchain.tools import tool
import subprocess

# 1. 定义工具
@tool
def read_file(file_path: str) -> str:
    """读取指定文件内容"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

@tool
def run_linter(file_path: str) -> str:
    """运行代码检查工具"""
    result = subprocess.run(
        ['pylint', file_path], 
        capture_output=True, 
        text=True
    )
    return result.stdout

# 2. 创建Agent
code_reviewer = Agent(
    role='资深代码审查员',
    goal='发现代码中的潜在问题并提供改进建议',
    backstory='你是一位有10年经验的代码审查专家，擅长发现代码异味和性能瓶颈',
    tools=[read_file, run_linter],
    verbose=True
)

# 3. 定义任务
review_task = Task(
    description='审查 {file_path} 文件的代码质量，包括：\n'
                '1. 代码风格和规范问题\n'
                '2. 潜在的bug和安全问题\n'
                '3. 性能优化建议\n'
                '请输出结构化的审查报告',
    expected_output='包含问题列表和修复建议的Markdown格式报告',
    agent=code_reviewer
)

# 4. 组建Crew并运行
crew = Crew(
    agents=[code_reviewer],
    tasks=[review_task]
)

result = crew.kickoff(inputs={'file_path': 'src/main.py'})
print(result)
```

### 📝 阶段二验收清单

- [ ] 成功运行至少 1 个 Agent 框架示例
- [ ] 理解 Agent 与 Workflow 的核心区别
- [ ] 完成"代码审查Agent"项目，能调用 2+ 工具
- [ ] 能够解释 Agent Loop 的工作原理

---

## 第三阶段：Skills开发（1.5周）

> **目标**：掌握模块化技能开发，能构建可复用的AI能力
> 
> ✅ **阶段验收**：编写 3 个个人 Skills，含完整 SKILL.md + 脚本实现

### Skills核心概念

- **Skills本质**：Prompt模板 + 可执行代码
- **开发模式**：Markdown定义 + 脚本实现
- **目录结构**：`SKILL.md` + 工具脚本
- **渐进式加载**：按需加载，动态扩展

### Skills标准结构

```
skills/
└── my-skill/
    ├── SKILL.md          # 技能定义文档（必须）
    ├── main.py           # 主逻辑脚本
    ├── utils.py          # 工具函数（可选）
    └── test_skill.py     # 测试脚本（建议）
```

### SKILL.md 完整模板

```markdown
---
name: git-assistant
version: 1.0.0
description: Git操作助手，自动生成提交信息和PR描述
author: your-name
tags: [git, automation]
inputs:
  - name: action
    type: string
    enum: [commit, pr, status]
    description: 要执行的Git操作
    required: true
  - name: message_style
    type: string
    enum: [conventional, simple, detailed]
    default: conventional
    description: 提交信息风格
outputs:
  - name: result
    type: string
    description: 操作结果或生成的内容
---

# Git Assistant Skill

## 功能说明

自动分析代码变更，生成规范的Git提交信息或PR描述。

## 使用示例

### 生成提交信息
```
action: commit
message_style: conventional
```

### 生成PR描述
```
action: pr
```

## 实现说明

- 使用 `git diff` 获取变更内容
- 分析变更类型（feature/fix/docs/refactor）
- 生成符合Conventional Commits规范的提交信息

## 注意事项

- 需要在Git仓库根目录运行
- 暂存区（staging area）需要有变更
```

### 实战项目1：Git提交助手Skill

**SKILL.md**：

```markdown
---
name: git-commit-assistant
version: 1.0.0
description: 自动生成符合规范的Git提交信息
tags: [git, commit, automation]
---

# Git Commit Assistant

分析暂存区的代码变更，自动生成Conventional Commits格式的提交信息。
```

**main.py**：

```python
#!/usr/bin/env python3
"""Git提交助手 - 自动生成规范提交信息"""

import subprocess
import sys
from typing import Optional

def get_staged_diff() -> str:
    """获取暂存区的代码变更"""
    result = subprocess.run(
        ['git', 'diff', '--cached', '--stat'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        raise RuntimeError("无法获取Git差异，请确保在Git仓库中")
    return result.stdout

def analyze_changes(diff: str) -> dict:
    """分析变更类型和范围"""
    analysis = {
        'files_changed': [],
        'has_tests': False,
        'has_docs': False,
        'suggested_type': 'feat'  # feat, fix, docs, refactor, test
    }
    
    for line in diff.split('\n'):
        if '|' in line:
            file_name = line.split('|')[0].strip()
            analysis['files_changed'].append(file_name)
            
            if 'test' in file_name.lower():
                analysis['has_tests'] = True
            if file_name.endswith('.md') or 'docs' in file_name:
                analysis['has_docs'] = True
                analysis['suggested_type'] = 'docs'
            if 'fix' in file_name.lower() or 'bug' in file_name.lower():
                analysis['suggested_type'] = 'fix'
    
    return analysis

def generate_commit_message(analysis: dict, style: str = 'conventional') -> str:
    """生成提交信息"""
    files = analysis['files_changed']
    
    if style == 'conventional':
        type_prefix = analysis['suggested_type']
        scope = files[0].split('/')[0] if '/' in files[0] else 'core'
        
        if analysis['has_tests']:
            message = f"{type_prefix}({scope}): 添加{scope}模块功能及测试"
        elif analysis['has_docs']:
            message = f"docs: 更新文档"
        else:
            message = f"{type_prefix}({scope}): 更新{scope}模块"
    else:
        message = f"更新: {', '.join(files[:3])}"
        if len(files) > 3:
            message += f" 等{len(files)}个文件"
    
    return message

def main():
    """主入口"""
    try:
        diff = get_staged_diff()
        if not diff.strip():
            print("❌ 暂存区为空，请先执行 git add")
            sys.exit(1)
        
        analysis = analyze_changes(diff)
        message = generate_commit_message(analysis)
        
        print("📝 建议的提交信息：")
        print(f"   {message}")
        print()
        print("📊 变更统计：")
        print(f"   修改文件: {len(analysis['files_changed'])}个")
        print(f"   包含测试: {'是' if analysis['has_tests'] else '否'}")
        print(f"   包含文档: {'是' if analysis['has_docs'] else '否'}")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

**test_skill.py**：

```python
import unittest
from main import analyze_changes, generate_commit_message

class TestGitCommitAssistant(unittest.TestCase):
    
    def test_analyze_changes_detects_tests(self):
        diff = "src/main.py | 10 ++++++\ntest_main.py | 5 +++++"
        result = analyze_changes(diff)
        self.assertTrue(result['has_tests'])
    
    def test_analyze_changes_detects_docs(self):
        diff = "README.md | 20 ++++++\nsrc/main.py | 5 +"
        result = analyze_changes(diff)
        self.assertTrue(result['has_docs'])
        self.assertEqual(result['suggested_type'], 'docs')
    
    def test_generate_conventional_commit(self):
        analysis = {
            'files_changed': ['src/api/user.py'],
            'has_tests': True,
            'has_docs': False,
            'suggested_type': 'feat'
        }
        message = generate_commit_message(analysis, 'conventional')
        self.assertIn('feat(src)', message)

if __name__ == '__main__':
    unittest.main()
```

### 📝 阶段三验收清单

- [ ] 理解 Skills 的标准结构（SKILL.md + 脚本）
- [ ] 完成 3 个个人 Skills：Git助手、文档生成、代码格式化
- [ ] 每个 Skill 包含完整的 SKILL.md + 可运行脚本
- [ ] 至少 1 个 Skill 包含测试脚本

---

## 第四阶段：MCP协议开发（1.5周）

> **目标**：掌握 MCP 协议，能搭建符合规范的 MCP Server
> 
> ✅ **阶段验收**：实现 1 个可运行的 MCP Server，暴露 2+ Tools 和 1+ Resource

### MCP核心概念

- **MCP vs Skills**：协议层 vs 应用层
  - Skills：面向AI工具的高级封装（Kimi Code / Claude Code 内部使用）
  - MCP：标准化协议，让任何AI客户端都能调用
- **MCP架构**：Client-Server模型
- **核心组件**：Tools（工具）、Resources（资源）、Prompts（提示词模板）

### MCP协议通信流程

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  AI Client  │ ──────→ │  MCP Host   │ ──────→ │ MCP Server  │
│(Claude/Cursor│ ←────── │ (Bridge)    │ ←────── │ (Your Code) │
└─────────────┘   JSON  └─────────────┘  stdio  └─────────────┘
                      RPC over stdio/sse
```

### MCP Server最小可运行示例（Python）

**项目结构**：
```
my-mcp-server/
├── server.py          # MCP Server主文件
├── requirements.txt   # 依赖
└── README.md          # 使用说明
```

**requirements.txt**：
```
mcp>=1.0.0
```

**server.py**：

```python
#!/usr/bin/env python3
"""
MCP Server示例：文件系统工具
暴露文件读取、搜索等能力给AI客户端
"""

import os
import json
from typing import Any
from mcp.server import Server
from mcp.types import TextContent, Tool, Resource

# 创建MCP Server实例
app = Server("filesystem-server")

# ============ Tools 定义 ============

TOOLS = [
    Tool(
        name="read_file",
        description="读取指定文件的内容",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "文件的绝对路径或相对路径"
                },
                "limit": {
                    "type": "integer",
                    "description": "最多读取行数（可选）",
                    "default": 100
                }
            },
            "required": ["path"]
        }
    ),
    Tool(
        name="list_directory",
        description="列出目录内容",
        inputSchema={
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "目录路径",
                    "default": "."
                }
            },
            "required": []
        }
    ),
    Tool(
        name="search_files",
        description="在指定目录中搜索包含关键字的文件",
        inputSchema={
            "type": "object",
            "properties": {
                "directory": {
                    "type": "string",
                    "description": "搜索目录"
                },
                "keyword": {
                    "type": "string",
                    "description": "搜索关键词"
                },
                "extension": {
                    "type": "string",
                    "description": "文件扩展名过滤（如.py, .md）",
                    "default": ""
                }
            },
            "required": ["directory", "keyword"]
        }
    )
]

# ============ Resources 定义 ============

RESOURCES = [
    Resource(
        uri="file://project-structure",
        name="project-structure",
        description="项目目录结构概览",
        mimeType="text/plain"
    )
]

# ============ 工具实现 ============

@app.list_tools()
async def list_tools() -> list[Tool]:
    """暴露可用工具列表"""
    return TOOLS

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """处理工具调用"""
    
    if name == "read_file":
        return await handle_read_file(arguments)
    elif name == "list_directory":
        return await handle_list_directory(arguments)
    elif name == "search_files":
        return await handle_search_files(arguments)
    else:
        raise ValueError(f"未知工具: {name}")

def validate_path(path: str) -> str:
    """验证并规范化路径"""
    # 防止目录遍历攻击
    abs_path = os.path.abspath(os.path.expanduser(path))
    cwd = os.getcwd()
    
    # 限制在工作目录内（安全策略）
    if not abs_path.startswith(cwd):
        raise PermissionError(f"访问被拒绝: 路径 {path} 超出工作目录")
    
    return abs_path

async def handle_read_file(args: dict) -> list[TextContent]:
    """处理文件读取"""
    path = validate_path(args["path"])
    limit = args.get("limit", 100)
    
    if not os.path.exists(path):
        raise FileNotFoundError(f"文件不存在: {args['path']}")
    
    if not os.path.isfile(path):
        raise ValueError(f"路径不是文件: {args['path']}")
    
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()[:limit]
        content = ''.join(lines)
    
    return [TextContent(
        type="text",
        text=f"📄 文件: {path}\n{'='*50}\n{content}\n{'='*50}\n"
             f"（共 {len(lines)} 行，限制 {limit} 行）"
    )]

async def handle_list_directory(args: dict) -> list[TextContent]:
    """处理目录列表"""
    path = validate_path(args.get("path", "."))
    
    if not os.path.isdir(path):
        raise ValueError(f"路径不是目录: {args.get('path', '.')}")
    
    items = os.listdir(path)
    
    # 分类显示
    dirs = [d for d in items if os.path.isdir(os.path.join(path, d))]
    files = [f for f in items if os.path.isfile(os.path.join(path, f))]
    
    result = f"📁 目录: {path}\n{'='*50}\n"
    result += "\n[目录]\n"
    for d in sorted(dirs):
        result += f"  📂 {d}/\n"
    
    result += "\n[文件]\n"
    for f in sorted(files):
        size = os.path.getsize(os.path.join(path, f))
        result += f"  📄 {f} ({size} bytes)\n"
    
    return [TextContent(type="text", text=result)]

async def handle_search_files(args: dict) -> list[TextContent]:
    """处理文件搜索"""
    directory = validate_path(args["directory"])
    keyword = args["keyword"]
    extension = args.get("extension", "")
    
    matches = []
    
    for root, dirs, files in os.walk(directory):
        # 跳过隐藏目录
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        for file in files:
            if extension and not file.endswith(extension):
                continue
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if keyword in content:
                        # 找出匹配行
                        lines = content.split('\n')
                        match_lines = [f"    Line {i+1}: {line[:100]}"
                                      for i, line in enumerate(lines)
                                      if keyword in line]
                        matches.append({
                            'file': file_path,
                            'preview': match_lines[:3]  # 最多显示3行
                        })
            except Exception:
                continue
    
    if not matches:
        return [TextContent(type="text", 
                           text=f"未找到包含 '{keyword}' 的文件")]
    
    result = f"🔍 搜索结果: '{keyword}'\n{'='*50}\n"
    result += f"找到 {len(matches)} 个匹配文件:\n\n"
    
    for match in matches:
        result += f"📄 {match['file']}\n"
        for line in match['preview']:
            result += f"{line}\n"
        result += "\n"
    
    return [TextContent(type="text", text=result)]

# ============ Resources 实现 ============

@app.list_resources()
async def list_resources() -> list[Resource]:
    """暴露可用资源列表"""
    return RESOURCES

@app.read_resource()
async def read_resource(uri: str) -> str:
    """读取资源内容"""
    
    if uri == "file://project-structure":
        # 生成项目结构树
        result = "项目目录结构:\n"
        for root, dirs, files in os.walk('.'):
            # 跳过隐藏目录
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            level = root.replace('.', '').count(os.sep)
            indent = '  ' * level
            result += f"{indent}📂 {os.path.basename(root)}/\n"
            
            sub_indent = '  ' * (level + 1)
            for file in files[:5]:  # 每个目录最多显示5个文件
                result += f"{sub_indent}📄 {file}\n"
            if len(files) > 5:
                result += f"{sub_indent}... 还有 {len(files)-5} 个文件\n"
        
        return result
    
    raise ValueError(f"未知资源: {uri}")

# ============ 启动服务 ============

if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    
    async def main():
        async with stdio_server(server=app) as (read_stream, write_stream):
            await app.run(
                read_stream,
                write_stream,
                app.create_initialization_options()
            )
    
    asyncio.run(main())
```

### 配置 Claude Desktop 使用 MCP Server

**claude_desktop_config.json**：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "python",
      "args": ["/path/to/my-mcp-server/server.py"],
      "env": {
        "PYTHONPATH": "/path/to/my-mcp-server"
      }
    }
  }
}
```

### MCP Server 调试技巧

1. **本地测试**：使用 MCP Inspector 工具
   ```bash
   npx @anthropics/mcp-inspector node server.js
   ```

2. **日志输出**：在 server.py 中添加 `print()` 或使用 `logging` 模块

3. **协议验证**：确保返回格式符合 MCP 规范

### 📝 阶段四验收清单

- [ ] 理解 MCP Client-Server 架构
- [ ] 成功运行 MCP Server，支持 stdio 通信
- [ ] 暴露至少 3 个 Tools（read_file, list_directory, search_files）
- [ ] 暴露至少 1 个 Resource
- [ ] 在 Claude Desktop 或 Cursor 中成功调用

---

## 第五阶段：Harness工程开发（3-4周）

> **目标**：理解并构建工业级Agent系统（Claude Code的核心技术）
> 
> ✅ **阶段验收**：Mini Harness 代码可运行，支持基础权限控制 + 子Agent系统

### Harness核心概念

- **Harness定义**：包裹LLM的运行时外壳，提供工具、权限、记忆、Hooks等能力
- **核心价值**：将"裸LLM调用"升级为"工业级Agent系统"

### Harness六层架构

```
┌─────────────────────────────────────────┐
│  第6层: 配置层 (Configuration)           │  CLAUDE.md, .cursorrules
├─────────────────────────────────────────┤
│  第5层: 上下文工程 (Context Engineering) │  四级压缩、记忆注入
├─────────────────────────────────────────┤
│  第4层: 沙盒 (Sandbox)                   │  文件系统隔离、网络限制
├─────────────────────────────────────────┤
│  第3层: Hooks系统                        │  26个事件点 × 4种Hook类型
├─────────────────────────────────────────┤
│  第2层: 权限模型                         │  Read/Write/Execute/Connect/Admin
├─────────────────────────────────────────┤
│  第1层: 工具系统 (Tools)                 │  Bash, Read, Write, 自定义工具
└─────────────────────────────────────────┘
```

### 权限模型详解

| 权限级别 | 说明 | 风险等级 |
|---------|------|---------|
| **Read** | 读取文件、查看目录 | 🟢 低 |
| **Write** | 修改文件、创建目录 | 🟡 中 |
| **Execute** | 运行命令、执行脚本 | 🟠 高 |
| **Connect** | 网络请求、API调用 | 🟠 高 |
| **Admin** | 系统级操作、权限变更 | 🔴 极高 |

### Mini Harness 实现框架（Python）

**项目结构**：
```
mini-harness/
├── harness/
│   ├── __init__.py
│   ├── core.py          # 核心Agent Loop
│   ├── permissions.py   # 权限系统
│   ├── tools.py         # 工具注册与管理
│   ├── memory.py        # 记忆系统
│   └── hooks.py         # Hooks系统
├── agents/
│   ├── __init__.py
│   ├── base.py          # 基础Agent
│   └── sub_agent.py     # 子Agent实现
├── main.py              # 入口文件
└── config.py            # 配置管理
```

**harness/core.py**：

```python
"""
Mini Harness - 简化版Agent运行时核心
演示：Agent Loop + 权限控制 + 工具调用
"""

import json
from typing import Dict, List, Callable, Any
from dataclasses import dataclass
from enum import Enum
import time

class Permission(Enum):
    READ = "read"
    WRITE = "write"
    EXECUTE = "execute"
    CONNECT = "connect"
    ADMIN = "admin"

@dataclass
class AgentState:
    """Agent状态管理"""
    iteration: int = 0
    max_iterations: int = 50
    context_window: List[Dict] = None
    memory: Dict = None
    
    def __post_init__(self):
        if self.context_window is None:
            self.context_window = []
        if self.memory is None:
            self.memory = {}

@dataclass
class ToolResult:
    """工具调用结果"""
    success: bool
    output: str
    error: str = None

class PermissionManager:
    """权限管理系统"""
    
    def __init__(self, allowed_permissions: List[Permission] = None):
        self.allowed = set(allowed_permissions or [Permission.READ])
    
    def check(self, permission: Permission) -> bool:
        return permission in self.allowed
    
    def require(self, permission: Permission, action: str):
        if not self.check(permission):
            raise PermissionError(
                f"权限不足: 需要 {permission.value} 权限才能执行 {action}"
            )

class ToolRegistry:
    """工具注册中心"""
    
    def __init__(self, permission_manager: PermissionManager):
        self.tools: Dict[str, Callable] = {}
        self.permissions: Dict[str, Permission] = {}
        self.pm = permission_manager
    
    def register(self, name: str, func: Callable, required_permission: Permission):
        """注册工具"""
        self.tools[name] = func
        self.permissions[name] = required_permission
    
    def call(self, name: str, **kwargs) -> ToolResult:
        """调用工具"""
        if name not in self.tools:
            return ToolResult(False, "", f"未知工具: {name}")
        
        required = self.permissions[name]
        if not self.pm.check(required):
            return ToolResult(
                False, 
                "", 
                f"权限拒绝: {name} 需要 {required.value} 权限"
            )
        
        try:
            result = self.tools[name](**kwargs)
            return ToolResult(True, str(result))
        except Exception as e:
            return ToolResult(False, "", str(e))

class AgentLoop:
    """
    Agent核心循环: while(true) { 思考 → 行动 → 观察 }
    """
    
    def __init__(
        self,
        llm_client,  # LLM客户端
        tools: ToolRegistry,
        state: AgentState = None
    ):
        self.llm = llm_client
        self.tools = tools
        self.state = state or AgentState()
        self.hooks = {}  # 简化版Hooks系统
    
    def register_hook(self, event: str, callback: Callable):
        """注册Hook"""
        if event not in self.hooks:
            self.hooks[event] = []
        self.hooks[event].append(callback)
    
    def trigger_hooks(self, event: str, data: Any) -> Any:
        """触发Hooks"""
        if event in self.hooks:
            for callback in self.hooks[event]:
                data = callback(data) or data
        return data
    
    def run(self, task: str) -> str:
        """运行Agent循环"""
        print(f"🚀 启动Agent任务: {task}")
        print(f"   最大迭代次数: {self.state.max_iterations}")
        print("-" * 50)
        
        # 初始化上下文
        self.state.context_window.append({
            "role": "system",
            "content": "你是一个有工具的AI助手。分析用户需求，选择合适的工具。"
        })
        self.state.context_window.append({
            "role": "user",
            "content": task
        })
        
        # Agent Loop
        while self.state.iteration < self.state.max_iterations:
            self.state.iteration += 1
            print(f"\n🔄 迭代 {self.state.iteration}/{self.state.max_iterations}")
            
            # Hook: 迭代开始前
            self.trigger_hooks("before_iteration", self.state)
            
            # 1. 思考: 调用LLM
            response = self._call_llm()
            print(f"🤖 LLM: {response[:100]}...")
            
            # 2. 解析: 提取工具调用意图
            tool_call = self._parse_tool_intent(response)
            
            if tool_call is None:
                # 无需工具，直接返回结果
                print("✅ 任务完成")
                return response
            
            # 3. 行动: 执行工具
            print(f"🔧 调用工具: {tool_call['name']}")
            result = self.tools.call(
                tool_call['name'],
                **tool_call.get('params', {})
            )
            
            # Hook: 工具调用后
            self.trigger_hooks("after_tool_call", {
                "tool": tool_call['name'],
                "result": result
            })
            
            # 4. 观察: 将结果反馈给LLM
            observation = f"工具 {tool_call['name']} 返回: {result.output}"
            if not result.success:
                observation += f" (错误: {result.error})"
            
            self.state.context_window.append({
                "role": "assistant",
                "content": response
            })
            self.state.context_window.append({
                "role": "system",
                "content": observation
            })
            
            print(f"📊 结果: {'成功' if result.success else '失败'}")
            
            # Hook: 迭代结束后
            self.trigger_hooks("after_iteration", self.state)
            
            # 简单的延迟，避免过快调用
            time.sleep(0.1)
        
        print("⚠️ 达到最大迭代次数，强制结束")
        return "任务执行超时，请检查任务复杂度或调整max_iterations"
    
    def _call_llm(self) -> str:
        """调用LLM（这里使用模拟实现）"""
        # 实际项目中替换为真实的LLM调用
        # 例如: OpenAI, Claude, 或其他模型
        last_message = self.state.context_window[-1]['content']
        
        # 模拟：如果用户要求读取文件，返回工具调用意图
        if "read" in last_message.lower() or "读取" in last_message:
            return json.dumps({
                "thought": "用户要求读取文件，我需要使用read_file工具",
                "tool": "read_file",
                "params": {"path": "example.txt"}
            })
        
        return "我已理解您的需求。这是一个演示回复。"
    
    def _parse_tool_intent(self, response: str) -> Dict:
        """解析LLM响应中的工具调用意图"""
        try:
            data = json.loads(response)
            if "tool" in data:
                return {
                    "name": data["tool"],
                    "params": data.get("params", {})
                }
        except json.JSONDecodeError:
            pass
        return None


# ============ 使用示例 ============

if __name__ == "__main__":
    # 1. 创建权限管理器（只允许读取）
    pm = PermissionManager([Permission.READ])
    
    # 2. 创建工具注册中心
    tools = ToolRegistry(pm)
    
    # 3. 注册工具
    def read_file(path: str) -> str:
        with open(path, 'r') as f:
            return f.read()[:100]
    
    def write_file(path: str, content: str) -> str:
        with open(path, 'w') as f:
            f.write(content)
        return "写入成功"
    
    tools.register("read_file", read_file, Permission.READ)
    tools.register("write_file", write_file, Permission.WRITE)
    
    # 4. 创建Agent并运行
    agent = AgentLoop(llm_client=None, tools=tools)
    
    # 添加一个Hook示例
    def log_tool_usage(data):
        print(f"[HOOK] 工具调用记录: {data['tool']}")
    
    agent.register_hook("after_tool_call", log_tool_usage)
    
    # 测试：尝试读取文件（有权限）
    print("=" * 50)
    print("测试1: 读取文件（有权限）")
    result = tools.call("read_file", path="example.txt")
    print(f"结果: {result}")
    
    # 测试：尝试写入文件（无权限，应该失败）
    print("\n" + "=" * 50)
    print("测试2: 写入文件（无权限）")
    result = tools.call("write_file", path="test.txt", content="hello")
    print(f"结果: {result}")
```

### 子Agent系统（Sub-Agent）

```python
# agents/sub_agent.py
"""
子Agent系统：只读探索 + 规划 + 执行分离
"""

from typing import List, Dict
from dataclasses import dataclass

@dataclass
class SubAgent:
    """子Agent配置"""
    name: str
    role: str  # "explorer" | "planner" | "executor"
    permissions: List[str]
    readonly: bool = False

class SubAgentSystem:
    """
    子Agent协调系统
    
    工作流程：
    1. Explorer Agent（只读）：探索代码库，收集信息
    2. Planner Agent：基于信息制定执行计划
    3. Executor Agent：按计划执行具体操作
    """
    
    def __init__(self, harness):
        self.harness = harness
        self.agents: Dict[str, SubAgent] = {}
    
    def create_explorer(self, name: str = "explorer") -> SubAgent:
        """创建只读探索Agent"""
        agent = SubAgent(
            name=name,
            role="explorer",
            permissions=["read"],
            readonly=True
        )
        self.agents[name] = agent
        return agent
    
    def create_planner(self, name: str = "planner") -> SubAgent:
        """创建规划Agent"""
        agent = SubAgent(
            name=name,
            role="planner",
            permissions=["read"],
            readonly=True
        )
        self.agents[name] = agent
        return agent
    
    def create_executor(self, name: str = "executor") -> SubAgent:
        """创建执行Agent"""
        agent = SubAgent(
            name=name,
            role="executor",
            permissions=["read", "write", "execute"],
            readonly=False
        )
        self.agents[name] = agent
        return agent
    
    async def run_workflow(self, task: str) -> str:
        """运行完整的子Agent工作流"""
        
        # Phase 1: 探索
        print("\n🔍 Phase 1: 探索阶段（只读）")
        explorer = self.agents.get("explorer") or self.create_explorer()
        context = await self._run_agent(explorer, f"探索以下内容: {task}")
        
        # Phase 2: 规划
        print("\n📋 Phase 2: 规划阶段")
        planner = self.agents.get("planner") or self.create_planner()
        plan = await self._run_agent(
            planner, 
            f"基于以下信息制定执行计划:\n{context}\n\n任务: {task}"
        )
        
        # Phase 3: 执行
        print("\n⚡ Phase 3: 执行阶段")
        executor = self.agents.get("executor") or self.create_executor()
        result = await self._run_agent(
            executor,
            f"按照以下计划执行:\n{plan}"
        )
        
        return result
    
    async def _run_agent(self, agent: SubAgent, task: str) -> str:
        """运行单个Agent"""
        print(f"   运行 {agent.name} ({agent.role}) - 只读: {agent.readonly}")
        # 实际实现中，这里会创建受限的AgentLoop实例
        return f"[{agent.name}输出] 处理: {task[:50]}..."
```

### 📝 阶段五验收清单

- [ ] 理解 Harness 六层架构
- [ ] 实现 Mini Harness，支持基础 Agent Loop
- [ ] 实现五级权限模型（Read/Write/Execute/Connect/Admin）
- [ ] 实现至少 3 个基础工具（Read/Write/Execute）
- [ ] 实现子Agent系统（Explorer → Planner → Executor）
- [ ] 添加至少 2 个 Hooks 事件处理

---

## 第六阶段：AI本地化与记忆系统（扩展选修）

> **目标**：实现AI的本地部署和持久化记忆
> 
> ⚠️ **可选阶段**：与四大核心目标关联度较低，建议核心路径完成后再深入学习

### 本地LLM部署

- **Ollama**：本地运行开源模型（Llama、DeepSeek等）
- **LM Studio**：图形化管理本地模型
- **模型量化**：GGUF格式，降低显存需求

### RAG系统构建

- **文档处理**：PDF/Word/Excel解析
- **向量化**：SentenceTransformer嵌入
- **向量数据库**：Qdrant、Chroma、Milvus
- **检索策略**：语义搜索 + 重排序

### 持久化记忆方案

- **三层记忆**：工作记忆 → 短期记忆 → 长期记忆
- **记忆存储**：Markdown文件 + SQLite索引
- **记忆管理**：写入/更新/遗忘机制
- **跨会话同步**：Mem0、Letta等方案

---

## 推荐工具栈

### AI编程工具组合

| 工具 | 成本 | 用途 |
|------|------|------|
| **Claude Code** | $20/月 | 复杂任务、多文件重构 |
| **Cursor** | $20/月 | 日常编码、Tab补全 |
| **Kimi Code** | 免费/按需 | 国内替代、中文场景 |
| **GitHub Copilot** | $10/月 | 内联补全 |

### 开发框架与工具

| 类别 | 推荐工具 | 说明 |
|------|----------|------|
| **Agent框架** | CrewAI → LangGraph | 新手先用CrewAI，进阶用LangGraph |
| **MCP开发** | Python SDK / TypeScript SDK | 官方SDK |
| **向量数据库** | Chroma / Qdrant | 本地优先 |
| **本地LLM** | Ollama | 零配置运行 |
| **记忆系统** | Mem0 / 自研 | 参考OpenClaw |

---

## 学习资源推荐

### 官方文档（必读）

- **Claude Code文档**：https://code.claude.com/docs
- **MCP协议规范**：https://modelcontextprotocol.io
- **CrewAI文档**：https://docs.crewai.com
- **LangGraph文档**：https://langchain-ai.github.io/langgraph/

### 实践项目（推荐顺序）

| 周数 | 项目 | 验收标准 |
|-----|------|---------|
| Week 1-2 | Claude Code实战 | 完成3次Plan Mode开发任务 |
| Week 3-4 | 代码Review Agent | 使用CrewAI，集成2+工具 |
| Week 5-6 | 3个个人Skills | 含Git助手、文档生成、代码格式化 |
| Week 7-8 | MCP文件服务器 | 暴露3+ Tools，Claude Desktop可调用 |
| Week 9-12 | Mini Harness | Python实现，支持权限+子Agent |

---

## 避坑指南

### 🔴 严重问题与解决方案

#### 1. Agent 无限循环

**现象**：Agent 反复调用相同工具，无法完成任务

**原因**：
- 上下文窗口丢失重要信息
- 工具返回结果格式不清晰
- 缺乏明确的终止条件

**解决方案**：
```python
# 在Agent Loop中添加循环检测
class AgentLoop:
    def __init__(self):
        self.tool_call_history = []
        self.max_repeated_calls = 3
    
    def detect_loop(self, tool_name: str) -> bool:
        """检测是否陷入循环"""
        self.tool_call_history.append(tool_name)
        recent = self.tool_call_history[-self.max_repeated_calls:]
        
        # 如果最近N次调用都是同一个工具，可能是循环
        if len(recent) == self.max_repeated_calls and len(set(recent)) == 1:
            return True
        return False
    
    def run(self, task: str):
        while self.iteration < self.max_iterations:
            # ... 原有代码 ...
            
            if self.detect_loop(tool_call['name']):
                return "检测到循环调用，任务中止。请检查工具设计或任务描述。"
```

#### 2. MCP Server 连接失败

**现象**：Claude Desktop 无法连接到 MCP Server

**排查步骤**：
```bash
# 1. 检查配置文件路径
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Windows: %APPDATA%/Claude/claude_desktop_config.json

# 2. 验证Python路径
which python  # 获取绝对路径，使用绝对路径配置

# 3. 手动测试Server
python server.py  # 应该无错误启动

# 4. 查看Claude Desktop日志
# macOS: ~/Library/Logs/Claude/mcp*.log
```

**常见错误**：
| 错误信息 | 原因 | 解决 |
|---------|------|------|
| `spawn python ENOENT` | Python路径错误 | 使用绝对路径 |
| `ModuleNotFoundError` | 依赖未安装 | 在server.py同目录运行 `pip install mcp` |
| `Connection refused` | 端口冲突 | MCP使用stdio，检查是否有其他进程占用 |

#### 3. Skills 加载失败

**现象**：AI工具无法识别或加载 Skill

**排查清单**：
- [ ] SKILL.md 文件存在且文件名正确（大写）
- [ ] YAML frontmatter 格式正确（检查缩进）
- [ ] `name` 字段唯一，无重复
- [ ] 脚本文件有可执行权限（Linux/Mac: `chmod +x main.py`）
- [ ] 脚本第一行有 shebang（`#!/usr/bin/env python3`）

#### 4. 权限配置不当导致的安全问题

**危险操作**：
```python
# ❌ 错误：给Agent Admin权限
pm = PermissionManager([Permission.READ, Permission.WRITE, 
                        Permission.EXECUTE, Permission.ADMIN])

# ❌ 错误：路径验证绕过
def read_file(path):
    # 没有验证路径，可能导致目录遍历攻击
    with open(path) as f:
        return f.read()
```

**安全实践**：
```python
# ✅ 正确：最小权限原则
pm = PermissionManager([Permission.READ])  # 默认只读

# ✅ 正确：严格路径验证
def validate_path(path: str, base_dir: str) -> str:
    abs_path = os.path.abspath(os.path.expanduser(path))
    base = os.path.abspath(base_dir)
    if not abs_path.startswith(base):
        raise PermissionError("路径超出允许范围")
    return abs_path
```

#### 5. 上下文窗口超限

**现象**：LLM 遗忘早期对话内容，导致任务失败

**解决方案（四级压缩策略）**：

```python
class ContextCompressor:
    """四级上下文压缩"""
    
    def compress(self, messages: List[Dict], max_tokens: int = 8000):
        current_tokens = self.count_tokens(messages)
        
        if current_tokens <= max_tokens:
            return messages
        
        # Level 1: 移除系统提示中的示例
        messages = self.remove_examples(messages)
        
        # Level 2: 摘要化早期对话
        if self.count_tokens(messages) > max_tokens:
            messages = self.summarize_early_turns(messages)
        
        # Level 3: 丢弃最旧的对话轮
        if self.count_tokens(messages) > max_tokens:
            messages = self.drop_oldest_turns(messages)
        
        # Level 4: 紧急截断（保留系统提示和最新用户消息）
        if self.count_tokens(messages) > max_tokens:
            messages = self.emergency_truncate(messages)
        
        return messages
```

---

## 立即行动计划

### 今天就开始

1. **安装Claude Code**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **创建CLAUDE.md**  
   在项目根目录创建上下文文件，参考模板：
   ```markdown
   # Project Context
   
   ## 技术栈
   - 语言: Python 3.10+
   - 框架: FastAPI
   - 数据库: PostgreSQL
   
   ## 代码规范
   - 使用 black 格式化
   - 类型注解必填
   - 测试覆盖率 > 80%
   ```

3. **尝试Plan Mode**  
   按 `Shift+Tab` 切换，体验先规划后执行

### 本周目标

- [ ] 用Claude Code完成一个实际功能开发（使用Plan Mode）
- [ ] 阅读MCP协议简介文档（modelcontextprotocol.io）
- [ ] 安装CrewAI并运行官方示例

### 关键建议

✅ **应该做**：
- **不要学数学**：你的方向是工程化，不是算法研究
- **项目驱动**：每学一个概念，马上动手实现
- **工具组合**：没有银弹，学会组合使用多个工具
- **关注Harness**：这是2026年AI工程的核心竞争力
- **加入社区**：关注OpenClaw、Claude Code等开源项目

❌ **不要做**：
- 不要追求完美理解再动手，边做边学
- 不要一次性学多个框架，精通一个再扩展
- 不要忽视权限和安全，早期养成好习惯

---

## 附录：快速参考

### 常用命令速查

```bash
# Claude Code
claude                      # 启动
claude --agent <name>       # 使用自定义Agent
/batch                      # 批量模式
Shift+Tab                   # Plan Mode切换

# MCP Server测试
npx @anthropics/mcp-inspector node server.js

# CrewAI项目
pip install crewai
crewai create project my_project
```

### 学习进度追踪表

| 阶段 | 开始日期 | 完成日期 | 状态 |
|-----|---------|---------|------|
| 阶段1: AI编程工具 | | | ⬜ |
| 阶段2: Agent入门 | | | ⬜ |
| 阶段3: Skills开发 | | | ⬜ |
| 阶段4: MCP协议 | | | ⬜ |
| 阶段5: Harness工程 | | | ⬜ |

---

*文档优化时间：2025年4月*  
*优化内容：添加完整代码示例、验收清单、避坑指南、Skills模板、MCP Server实现*

---
## 关联笔记
- [[06-Skills开发与SKILL规范]] — 相同标签: automation, git
- [[07-Git助手Skill实战开发]] — 相同标签: automation, git
- [[01-Claude-Code实战-Plan-Mode工作流]] — 关键词匹配: Claude, AI, Agent
- [[03-理解AI-Agent的本质]] — 关键词匹配: Agent, Claude, 工程化
- [[04-CrewAI框架入门实战]] — 关键词匹配: AI, Agent
