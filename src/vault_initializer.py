"""Vault 目录初始化"""
from src.config import (
    VAULT_ROOT, INBOX_DIR, WORK_DIR, PROMPTS_DIR, AGENTS_DIR,
    SKILLS_DIR, MCP_DIR, WORKFLOWS_DIR, TUTORIALS_DIR,
    SHARING_DIR, TEMPLATES_DIR, ARCHIVE_DIR, ASSET_HISTORY_DIR,
    DRAFT_DIR, UNCLASSIFIED_DIR,
)
from src.utils import ensure_dir


def init_vault():
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
        print(f"[OK] {d}")
    print(f"\nVault 初始化完成: {VAULT_ROOT.absolute()}")


if __name__ == "__main__":
    init_vault()
