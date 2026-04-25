"""全局配置管理"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

VAULT_ROOT = Path(os.getenv("VAULT_ROOT", "./my-ai-vault"))

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

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "kimi")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.moonshot.cn/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "moonshot-v1-8k")
