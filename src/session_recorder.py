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
                idx = new_lines.index(ARCHIVE_CONFIG_MARKER)
                new_lines.insert(idx + 1, f"- session_archive_path: \"{archive_path}\"")
            fpath.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            print(f"[OK] 已记录配置到 {fpath}")
            return
    (project_root / "AGENTS.md").write_text(
        f"{ARCHIVE_CONFIG_MARKER}\n- session_archive_path: \"{archive_path}\"\n",
        encoding="utf-8"
    )
    print("[OK] 已创建 AGENTS.md 并记录配置")


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

    config = find_project_config(project_root)
    archive_path_str = config.get("session_archive_path")

    if archive_path_str:
        archive_dir = VAULT_ROOT / archive_path_str
        print(f"检测到已配置的归档路径: {archive_dir}")
        use_existing = input("使用此路径? [Y/n]: ").strip().lower()
        if use_existing not in ("", "y", "yes"):
            archive_path_str = None

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

        save_project_config(project_root, archive_path_str)

    archive_dir = VAULT_ROOT / archive_path_str
    ensure_dir(archive_dir)

    topic = input("会话主题: ").strip()
    project = input("项目名 (留空使用目录项目名): ").strip()
    if not project:
        project = archive_path_str.split("/")[1] if len(archive_path_str.split("/")) > 1 else "未分类"

    source = input("来源 (如 Kimi-Code): ").strip() or "unknown"
    background = input("背景描述: ").strip()

    print("核心 Prompt (多行输入, 单独输入空行结束):")
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
    print(f"\n[OK] 已保存: {file_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", default=".", help="项目根目录")
    args = parser.parse_args()
    record_session(Path(args.project_root))
