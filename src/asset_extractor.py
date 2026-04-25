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
    try:
        response = call_llm(EXTRACTION_PROMPT, content)
    except Exception as e:
        print(f"  [ERR] LLM 调用失败: {e}")
        return []
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
        print(f"  [WARN] LLM 返回格式异常，跳过")
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
        print(f"  [OK] 草稿: {file_path.name}")
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
        candidates = []
        for root in [INBOX_DIR, WORK_DIR]:
            if not root.exists():
                continue
            for f in root.rglob("*.md"):
                if "待提炼" in str(f):
                    continue
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
    print(f"\n[OK] 共提取 {total} 条候选资产到 {DRAFT_DIR}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", nargs="?", help="原料文件路径")
    args = parser.parse_args()
    extract(args.source)
