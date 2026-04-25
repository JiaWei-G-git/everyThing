# AI 知识库智能体 Hackathon MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 1 天内完成可验证的核心闭环：Vault 初始化 → 会话记录录入 → LLM 资产提炼 → 待提炼区输出，并生成 PDF 文档和演示视频素材。

**Architecture:** 纯 Python CLI 工具集，零外部服务依赖（除 LLM API）。文件操作为核心，LLM 调用为可选增强。所有配置通过 YAML 和环境变量管理。

**Tech Stack:** Python 3.10+, 标准库 (pathlib, argparse, datetime, re), Jinja2 (模板), requests (LLM API), python-dotenv, pyyaml

---

## 文件结构

```
aiKnowledgeBase/
├── src/
│   ├── __init__.py
│   ├── config.py              # Vault 路径、LLM API 配置
│   ├── vault_initializer.py   # Vault 目录初始化
│   ├── session_recorder.py    # F-001: 会话记录 Skill
│   ├── asset_extractor.py     # F-003: 资产提炼 Skill
│   └── utils.py               # 文件操作、YAML 读写、去重
├── templates/
│   ├── session_record.md      # 会话记录模板
│   ├── weekly_report.md       # 周报模板
│   └── prompt_asset.md        # Prompt 资产模板
├── demo/
│   └── demo_inputs/           # 3-5 条模拟会话记录文本
├── requirements.txt
└── .env.example               # API Key 配置模板
```

---

## Task 1: 项目脚手架与配置

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `src/config.py`
- Create: `src/__init__.py`
- Create: `src/utils.py`

- [ ] **Step 1: 创建 requirements.txt**

```
jinja2>=3.1.0
pyyaml>=6.0
python-dotenv>=1.0.0
requests>=2.31.0
```

- [ ] **Step 2: 创建 .env.example**

```
# LLM API 配置（三选一，默认 Kimi）
LLM_PROVIDER=kimi
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k

# Vault 根目录（默认当前目录下的 my-ai-vault）
VAULT_ROOT=./my-ai-vault
```

- [ ] **Step 3: 创建 src/config.py**

```python
"""全局配置管理"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

VAULT_ROOT = Path(os.getenv("VAULT_ROOT", "./my-ai-vault"))

# 目录常量
INBOX_DIR = VAULT_ROOT / "00-Inbox-收件箱"
WORK_DIR = VAULT_ROOT / "01-Work-工作记录"
PROMPTS_DIR = VAULT_ROOT / "10-Prompts-提示词"
AGENTS_DIR = VAULT_ROOT / "20-Agents-代理"
SKILLS_DIR = VAULT_ROOT / "30-Skills-技能"
MCP_DIR = VAULT_ROOT / "40-MCP-服务"
WORKFLOWS_DIR = VAULT_ROOT / "50-Workflows-工作流"
TUTORIALS_DIR = VAULT_ROOT / "60-Tutorials-教程"
SHARING_DIR = VAULT_ROOT / "70-Sharing-团队共享"
TEMPLATES_DIR = VAULT_ROOT / "90-Templates-模板"
ARCHIVE_DIR = VAULT_ROOT / "99-Archive-归档"
ASSET_HISTORY_DIR = ARCHIVE_DIR / "资产版本历史"
DRAFT_DIR = INBOX_DIR / "待提炼"
UNCLASSIFIED_DIR = WORK_DIR / "未分类"

ASSET_DIRS = {
    "prompt": PROMPTS_DIR,
    "agent": AGENTS_DIR,
    "skill": SKILLS_DIR,
    "mcp": MCP_DIR,
    "workflow": WORKFLOWS_DIR,
    "tutorial": TUTORIALS_DIR,
}

# LLM 配置
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "kimi")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.moonshot.cn/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "moonshot-v1-8k")
```

- [ ] **Step 4: 创建 src/utils.py**

```python
"""通用工具函数"""
import re
from pathlib import Path
from datetime import datetime


def sanitize_filename(name: str) -> str:
    """清理文件名中的非法字符"""
    return re.sub(r'[\\/:*?"<>|]', "-", name).strip("- ")


def ensure_dir(path: Path) -> Path:
    """确保目录存在，不存在则创建"""
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_unique_path(directory: Path, base_name: str, suffix: str = ".md") -> Path:
    """生成不重复的文件路径"""
    path = directory / f"{base_name}{suffix}"
    if not path.exists():
        return path
    counter = 1
    while True:
        path = directory / f"{base_name}-{counter}{suffix}"
        if not path.exists():
            return path
        counter += 1


def today_str() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")
```

- [ ] **Step 5: 创建 src/__init__.py**

空文件即可：`# AI Vault Agent`

- [ ] **Step 6: 安装依赖**

Run: `pip install -r requirements.txt`
Expected: 安装成功，无报错

- [ ] **Step 7: Commit**

```bash
git add requirements.txt .env.example src/
git commit -m "feat: project scaffold and config"
```

---

## Task 2: Vault 目录初始化与模板创建

**Files:**
- Create: `src/vault_initializer.py`
- Create: `templates/session_record.md`
- Create: `templates/weekly_report.md`
- Create: `templates/prompt_asset.md`

- [ ] **Step 1: 创建会话记录模板**

`templates/session_record.md`:
```markdown
---
project: "{{project}}"
date: "{{date}}"
topic: "{{topic}}"
source: "{{source}}"
tags: [{{tags}}]
status: active
---

# 会话记录 - {{topic}}

## 背景
{{background}}

## Prompt
```
{{prompt}}
```

## 解决思路
{{solution}}

## 优化经验
{{optimization}}

## 关联笔记
- [[相关文档]]
```

- [ ] **Step 2: 创建周报模板**

`templates/weekly_report.md`:
```markdown
---
project: "{{project}}"
period: "{{period}}"
date: "{{date}}"
tags: [周报, {{project}}]
---

# {{project}} - 周报 {{period}}

## 本周进展
{{progress}}

## 关键成果
{{achievements}}

## 问题与解决方案
{{problems}}

## 资产沉淀
{{assets}}

## 下周计划
{{next_plan}}
```

- [ ] **Step 3: 创建 Prompt 资产模板**

`templates/prompt_asset.md`:
```markdown
---
title: "{{title}}"
category: "prompt"
source: "{{source}}"
extracted_date: "{{extracted_date}}"
applicable_scenario: "{{scenario}}"
maturity: "draft"
tags: [{{tags}}]
---

# {{title}}

## 场景
{{scenario}}

## 模板
```
{{template}}
```

## 变量说明
{{variables}}

## 效果记录
{{effect}}

## 关联笔记
- [[相关文档]]
```

- [ ] **Step 4: 创建 vault_initializer.py**

```python
"""Vault 目录初始化"""
from jinja2 import Environment, FileSystemLoader
from src.config import (
    VAULT_ROOT, INBOX_DIR, WORK_DIR, PROMPTS_DIR, AGENTS_DIR,
    SKILLS_DIR, MCP_DIR, WORKFLOWS_DIR, TUTORIALS_DIR,
    SHARING_DIR, TEMPLATES_DIR, ARCHIVE_DIR, ASSET_HISTORY_DIR,
    DRAFT_DIR, UNCLASSIFIED_DIR,
)
from src.utils import ensure_dir


def init_vault():
    """初始化完整的 Vault 目录结构"""
    dirs = [
        INBOX_DIR, DRAFT_DIR,
        WORK_DIR, UNCLASSIFIED_DIR,
        PROMPTS_DIR, AGENTS_DIR, SKILLS_DIR, MCP_DIR,
        WORKFLOWS_DIR, TUTORIALS_DIR, SHARING_DIR,
        TEMPLATES_DIR / "周报",
        ARCHIVE_DIR, ASSET_HISTORY_DIR,
    ]
    for d in dirs:
        ensure_dir(d)
        print(f"✓ {d}")
    print(f"\nVault 初始化完成: {VAULT_ROOT.absolute()}")


if __name__ == "__main__":
    init_vault()
```

- [ ] **Step 5: 运行初始化并验证**

Run: `python -m src.vault_initializer`
Expected: 输出所有目录创建成功，VAULT_ROOT 下出现完整目录树

- [ ] **Step 6: Commit**

```bash
git add templates/ src/vault_initializer.py
git commit -m "feat: vault initializer and templates"
```

---

## Task 3: F-001 会话记录 Skill

**Files:**
- Create: `src/session_recorder.py`

- [ ] **Step 1: 实现会话记录器**

```python
"""F-001: 会话记录 Skill"""
import argparse
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from src.config import INBOX_DIR, WORK_DIR, UNCLASSIFIED_DIR, VAULT_ROOT
from src.utils import ensure_dir, get_unique_path, sanitize_filename, today_str, now_str

AGENTS_FILE_CANDIDATES = ["AGENTS.md", "CLAUDE.md"]
ARCHIVE_CONFIG_MARKER = "<!-- AI-Vault-Config -->"


def find_project_config(project_root: Path = Path(".")) -> dict:
    """读取项目级说明文件中的 Vault 配置"""
    config = {}
    for fname in AGENTS_FILE_CANDIDATES:
        fpath = project_root / fname
        if not fpath.exists():
            continue
        for line in fpath.read_text(encoding="utf-8").splitlines():
            if "session_archive_path:" in line:
                config["session_archive_path"] = line.split("session_archive_path:", 1)[1].strip().strip('"')
            if "weekly_template:" in line:
                config["weekly_template"] = line.split("weekly_template:", 1)[1].strip().strip('"')
    return config


def save_project_config(project_root: Path, archive_path: str):
    """在项目级说明文件中记录归档路径"""
    for fname in AGENTS_FILE_CANDIDATES:
        fpath = project_root / fname
        if fpath.exists():
            content = fpath.read_text(encoding="utf-8")
            if ARCHIVE_CONFIG_MARKER not in content:
                content += f"\n\n{ARCHIVE_CONFIG_MARKER}\n"
            lines = content.splitlines()
            new_lines = []
            replaced = False
            for line in lines:
                if "session_archive_path:" in line and ARCHIVE_CONFIG_MARKER in "\n".join(lines[:lines.index(line)+1]):
                    new_lines.append(f"- session_archive_path: \"{archive_path}\"")
                    replaced = True
                else:
                    new_lines.append(line)
            if not replaced:
                # 在 marker 后插入
                idx = new_lines.index(ARCHIVE_CONFIG_MARKER)
                new_lines.insert(idx + 1, f"- session_archive_path: \"{archive_path}\"")
            fpath.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print(f"✓ 已记录配置到 {fpath}")
            return
    # 没有现有文件，创建 AGENTS.md
    (project_root / "AGENTS.md").write_text(
        f"{ARCHIVE_CONFIG_MARKER}\n- session_archive_path: \"{archive_path}\"\n",
        encoding="utf-8"
    )
    print("✓ 已创建 AGENTS.md 并记录配置")


def list_work_folders() -> list:
    """列出 Work 下的现有项目目录"""
    if not WORK_DIR.exists():
        return []
    return [d.name for d in WORK_DIR.iterdir() if d.is_dir()]


def render_session_record(project: str, topic: str, source: str, background: str,
                          prompt: str, solution: str, optimization: str,
                          tags: list = None) -> str:
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("session_record.md")
    return template.render(
        project=project,
        date=now_str(),
        topic=topic,
        source=source,
        tags=", ".join(tags or []),
        background=background,
        prompt=prompt,
        solution=solution,
        optimization=optimization,
    )


def record_session(project_root: Path = Path(".")):
    """交互式会话记录入口"""
    print("=== AI Vault 会话记录 ===\n")

    # 1. 检查项目级配置
    config = find_project_config(project_root)
    archive_path_str = config.get("session_archive_path")

    if archive_path_str:
        archive_dir = VAULT_ROOT / archive_path_str
        print(f"检测到已配置的归档路径: {archive_dir}")
        use_existing = input("使用此路径? [Y/n]: ").strip().lower()
        if use_existing not in ("", "y", "yes"):
            archive_path_str = None

    # 2. 首次记录：询问路径
    if not archive_path_str:
        print("\n可用归档位置:")
        options = ["00-Inbox-收件箱/未分类"]
        existing_projects = list_work_folders()
        for p in existing_projects:
            options.append(f"01-Work-工作记录/{p}/会话记录")
            options.append(f"01-Work-工作记录/{p}/日志")
        for i, opt in enumerate(options, 1):
            print(f"  {i}. {opt}")
        print(f"  {len(options)+1}. 新建项目目录")

        choice = input("\n选择 [1]: ").strip()
        if not choice:
            choice = "1"
        choice = int(choice)

        if choice <= len(options):
            archive_path_str = options[choice - 1]
        else:
            new_project = input("项目名: ").strip()
            archive_path_str = f"01-Work-工作记录/{new_project}/会话记录"

        # 保存配置
        save_project_config(project_root, archive_path_str)

    # 3. 写入文件
    archive_dir = VAULT_ROOT / archive_path_str
    ensure_dir(archive_dir)

    topic = input("会话主题: ").strip()
    project = input("项目名 (留空使用目录项目名): ").strip()
    if not project:
        project = archive_path_str.split("/")[1] if len(archive_path_str.split("/")) > 1 else "未分类"

    source = input("来源 (如 Kimi-Code): ").strip() or "unknown"
    background = input("背景描述: ").strip()
    prompt = input("核心 Prompt (多行输入, 空行结束): \n")
    lines = []
    while True:
        line = input()
        if line.strip() == "" and lines:
            break
        lines.append(line)
    prompt = "\n".join(lines)

    solution = input("解决思路: ").strip()
    optimization = input("优化经验: ").strip()

    content = render_session_record(
        project=project, topic=topic, source=source,
        background=background, prompt=prompt,
        solution=solution, optimization=optimization,
    )

    base_name = f"会话记录-{today_str()}-{sanitize_filename(topic)}"
    file_path = get_unique_path(archive_dir, base_name)
    file_path.write_text(content, encoding="utf-8")
    print(f"\n✓ 已保存: {file_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", default=".", help="项目根目录")
    args = parser.parse_args()
    record_session(Path(args.project_root))
```

- [ ] **Step 2: 运行首次记录测试**

Run: `python -m src.session_recorder`
Expected: 交互流程正常，提示选择路径，输入内容后生成标准格式的 md 文件

- [ ] **Step 3: 运行二次记录测试**

Run: `python -m src.session_recorder`
Expected: 直接检测到 AGENTS.md 中的配置，不再询问路径

- [ ] **Step 4: Commit**

```bash
git add src/session_recorder.py
git commit -m "feat: F-001 session recorder skill with path memory"
```

---

## Task 4: F-003 资产提炼 Skill（简化版）

**Files:**
- Create: `src/asset_extractor.py`

- [ ] **Step 1: 实现 LLM 客户端**

在 `src/asset_extractor.py` 中先实现客户端：

```python
"""F-003: 资产提炼 Skill"""
import argparse
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import requests
from src.config import (
    LLM_API_KEY, LLM_BASE_URL, LLM_MODEL,
    INBOX_DIR, DRAFT_DIR, VAULT_ROOT,
    PROMPTS_DIR, SKILLS_DIR,
)
from src.utils import ensure_dir, get_unique_path, sanitize_filename, today_str


def call_llm(system_prompt: str, user_content: str) -> str:
    """调用 LLM API"""
    headers = {
        "Authorization": f"Bearer {LLM_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "temperature": 0.3,
    }
    resp = requests.post(f"{LLM_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


EXTRACTION_PROMPT = """你是一位知识库管理员。请阅读下面的工作记录，从中提取可复用的知识资产。

只关注以下两类资产：
1. **优质 Prompt** — 有效的提问模板，带使用场景
2. **原子 Skill** — 可复用的操作流程，带触发条件和执行步骤

对每条提取的资产，按以下 JSON 格式输出：
```json
[
  {
    "type": "prompt|skill",
    "name": "简短命名",
    "scenario": "使用场景",
    "content": "具体内容",
    "confidence": "high|medium|low"
  }
]
```

如果没有值得提取的资产，返回空数组 []。

---
工作记录内容：
"""


def extract_assets_from_file(file_path: Path) -> list:
    """从单个原料文件中提取资产"""
    content = file_path.read_text(encoding="utf-8")
    print(f"正在提炼: {file_path.name} ...")
    response = call_llm(EXTRACTION_PROMPT, content)
    # 尝试从 markdown 代码块中提取 JSON
    json_str = response
    if "```json" in response:
        json_str = response.split("```json")[1].split("```")[0].strip()
    elif "```" in response:
        json_str = response.split("```")[1].split("```")[0].strip()
    try:
        assets = json.loads(json_str)
        print(f"  发现 {len(assets)} 条候选资产")
        return assets
    except json.JSONDecodeError:
        print(f"  ⚠ LLM 返回格式异常，跳过")
        return []


def render_prompt_asset(asset: dict, source: str) -> str:
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("prompt_asset.md")
    return template.render(
        title=asset["name"],
        source=source,
        extracted_date=today_str(),
        scenario=asset.get("scenario", ""),
        template=asset.get("content", ""),
        variables="",
        effect="",
        tags="",
    )


def render_skill_asset(asset: dict, source: str) -> str:
    """Skill 资产使用简化模板（无专用模板文件时内联生成）"""
    return f"""---
type: skill_candidate
name: "{asset['name']}"
source: "{source}"
extracted_date: "{today_str()}"
status: draft
---

# {asset['name']}

## 触发条件
{asset.get('scenario', '')}

## 执行步骤
{asset.get('content', '')}

## 关联笔记
- [[相关文档]]
"""


def save_draft_assets(assets: list, source_file: str):
    """将提取的草稿保存到待提炼区"""
    ensure_dir(DRAFT_DIR)
    saved = []
    for i, asset in enumerate(assets, 1):
        asset_type = asset.get("type", "unknown")
        name = sanitize_filename(asset.get("name", f"未命名-{i}"))
        if asset_type == "prompt":
            content = render_prompt_asset(asset, source_file)
            file_path = get_unique_path(DRAFT_DIR, f"Prompt-{name}")
        else:
            content = render_skill_asset(asset, source_file)
            file_path = get_unique_path(DRAFT_DIR, f"Skill-{name}")
        file_path.write_text(content, encoding="utf-8")
        saved.append(file_path.name)
        print(f"  ✓ 草稿: {file_path.name}")
    return saved


def extract(source_path: str = None):
    """资产提炼入口"""
    print("=== AI Vault 资产提炼 ===\n")

    if source_path:
        target = Path(source_path)
        if not target.exists():
            print(f"文件不存在: {target}")
            return
        files = [target]
    else:
        # 默认读取最近 7 天新增的原料
        candidates = []
        for root in [INBOX_DIR, WORK_DIR]:
            if not root.exists():
                continue
            for f in root.rglob("*.md"):
                if "待提炼" in str(f):
                    continue
                # MVP 简化：不过滤时间，读取所有
                candidates.append(f)
        if not candidates:
            print("未找到原料文件")
            return
        print(f"发现 {len(candidates)} 个原料文件，全部处理:\n")
        files = candidates

    total = 0
    for f in files:
        rel_path = f.relative_to(VAULT_ROOT)
        assets = extract_assets_from_file(f)
        if assets:
            save_draft_assets(assets, str(rel_path))
            total += len(assets)
    print(f"\n✓ 共提取 {total} 条候选资产到 {DRAFT_DIR}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", help="原料文件路径")
    args = parser.parse_args()
    extract(args.source)
```

- [ ] **Step 2: 配置 API Key**

复制 `.env.example` 为 `.env`，填入有效的 LLM API Key。

Run: `cp .env.example .env`

- [ ] **Step 3: 运行提炼测试**

Run: `python -m src.asset_extractor`
Expected: 扫描原料文件，调用 LLM，输出草稿到 `00-Inbox-收件箱/待提炼/`

- [ ] **Step 4: 验证待提炼区文件**

Run: `ls my-ai-vault/00-Inbox-收件箱/待提炼/`
Expected: 看到生成的 Prompt/Skill 草稿文件

- [ ] **Step 5: Commit**

```bash
git add src/asset_extractor.py .env
git commit -m "feat: F-003 asset extractor with LLM"
```

---

## Task 5: 闭环验证（Demo 数据）

**Files:**
- Create: `demo/demo_inputs/session_demo_1.md` (模拟输入)

- [ ] **Step 1: 创建模拟会话记录文本**

`demo/demo_inputs/session_demo_1.md`:
```markdown
---
project: "电商后台"
date: "2026-04-25"
topic: "接口性能优化"
source: "Kimi-Code-Session"
tags: [backend, optimization]
status: active
---

# 会话记录 - 接口性能优化

## 背景
用户反馈商品列表接口响应时间超过 3 秒，需要排查优化。

## Prompt
```
请帮我分析这个 SQL 查询为什么慢，并给出优化方案：
SELECT * FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.status = 'active' 
ORDER BY p.created_at DESC;
```

## 解决思路
AI 建议添加复合索引 (status, created_at) 并避免 SELECT *。

## 优化经验
以后遇到慢查询，先让 AI 分析执行计划再动手改索引。
```

- [ ] **Step 2: 完整跑通闭环**

1. Run: `python -m src.vault_initializer`
2. Run: `python -m src.session_recorder` — 录入一条模拟会话
3. Run: `python -m src.asset_extractor` — 提炼资产
4. 检查 `00-Inbox-收件箱/待提炼/` 是否出现有效的 Prompt 草稿

- [ ] **Step 3: Commit demo 数据**

```bash
git add demo/
git commit -m "chore: demo data for hackathon"
```

---

## Task 6: PDF 文档生成

**Files:**
- Create: `scripts/generate_pdf.py`

- [ ] **Step 1: 安装 PDF 依赖**

Run: `pip install markdown weasyprint`

- [ ] **Step 2: 创建 PDF 生成脚本**

```python
"""将 PRD 转换为 PDF"""
import markdown
from pathlib import Path
from weasyprint import HTML, CSS

SPEC_PATH = Path("docs/superpowers/specs/2026-04-25-ai-vault-prd-v2-design.md")
OUTPUT_PATH = Path("AI知识库智能体_PRD_v2.0.pdf")

def generate_pdf():
    md_content = SPEC_PATH.read_text(encoding="utf-8")
    html_body = markdown.markdown(md_content, extensions=["tables", "fenced_code"])
    html_full = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>AI 知识库智能体 PRD v2.0</title>
        <style>
            body {{ font-family: "Microsoft YaHei", "SimHei", sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.8; color: #333; }}
            h1 {{ font-size: 28px; border-bottom: 2px solid #333; padding-bottom: 10px; }}
            h2 {{ font-size: 22px; margin-top: 30px; border-bottom: 1px solid #ddd; }}
            h3 {{ font-size: 18px; color: #555; }}
            code {{ background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 14px; }}
            pre {{ background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }}
            pre code {{ background: none; padding: 0; }}
            table {{ border-collapse: collapse; width: 100%; margin: 15px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background: #f5f5f5; }}
            blockquote {{ border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }}
        </style>
    </head>
    <body>
        {html_body}
    </body>
    </html>
    """
    HTML(string=html_full).write_pdf(str(OUTPUT_PATH))
    print(f"✓ PDF 已生成: {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_pdf()
```

- [ ] **Step 3: 生成 PDF**

Run: `python scripts/generate_pdf.py`
Expected: 生成 `AI知识库智能体_PRD_v2.0.pdf`

- [ ] **Step 4: Commit**

```bash
git add scripts/generate_pdf.py *.pdf
git commit -m "docs: generate PRD pdf"
```

---

## Task 7: 演示视频脚本

**Files:**
- Create: `demo/video_script.md`

- [ ] **Step 1: 编写演示脚本**

`demo/video_script.md`:
```markdown
# AI 知识库智能体 - Hackathon 演示脚本

## 片头 (15s)
- 标题：AI 知识库智能体 — 1 天 Hackathon MVP
- 展示核心闭环图：使用 AI → 沉淀知识库 → 提升技能 → 赋能团队

## Demo 1: Vault 初始化 (30s)
1. 运行 `python -m src.vault_initializer`
2. 展示生成的完整目录结构

## Demo 2: 会话记录 Skill (90s)
1. 运行 `python -m src.session_recorder`
2. 首次记录：选择归档路径 → 输入内容 → 保存
3. 展示生成的标准格式 Markdown 文件
4. 查看 AGENTS.md 中的路径记忆配置
5. 二次记录：直接复用路径，无需询问

## Demo 3: 资产提炼 (90s)
1. 运行 `python -m src.asset_extractor`
2. 展示 LLM 提取过程
3. 打开 `00-Inbox-收件箱/待提炼/` 查看草稿
4. 强调：人工确认后才能进入资产区

## 片尾 (15s)
- 总结：3 小时完成核心闭环
- 后续规划：周期整理、结构自治、VS Code 插件
- GitHub 仓库链接
```

- [ ] **Step 2: Commit**

```bash
git add demo/video_script.md
git commit -m "docs: demo video script"
```

---

## 最终验证清单

运行以下命令验证完整闭环：

```bash
# 1. 初始化
python -m src.vault_initializer

# 2. 录入会话（首次，选择路径）
python -m src.session_recorder

# 3. 再次录入（二次，自动复用路径）
python -m src.session_recorder

# 4. 提炼资产
python -m src.asset_extractor

# 5. 检查产出
ls my-ai-vault/01-Work-工作记录/   # 应有会话记录
ls my-ai-vault/00-Inbox-收件箱/待提炼/  # 应有资产草稿
ls my-ai-vault/AGENTS.md  # 应有路径配置

# 6. 生成 PDF
python scripts/generate_pdf.py
```

---

## Self-Review

| Spec 需求 | 对应 Task |
|-----------|-----------|
| Vault 目录结构 | Task 2 |
| F-001 会话记录 Skill + 路径记忆 | Task 3 |
| F-003 资产提炼 Skill | Task 4 |
| F-005 人工确认（待提炼区） | Task 4 (save_draft_assets) |
| F-002 多源输入 | MVP 简化为手动录入，由 F-001 覆盖 |
| F-010 周报模板自定义 | Task 2 (创建周报模板) |
| 统一 Skill 源 | 架构设计在 PRD 中说明，MVP 不实现 symlink 自动化 |
| PDF 产出 | Task 6 |
| 演示视频 | Task 7 (脚本) |

**缺口说明**：
- F-006 向量去重、F-007 自动标签、F-012~F-015 结构自治、VS Code 插件不在本次 MVP 范围内，标记为 P2 后续开发。
