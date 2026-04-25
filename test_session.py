"""测试会话记录 Skill 的完整流程"""
from pathlib import Path
from src.session_recorder import save_project_config, render_session_record, find_project_config
from src.utils import ensure_dir, get_unique_path, sanitize_filename, today_str
from src.config import VAULT_ROOT

project_root = Path(".")

print("=== 测试 1: 首次记录 ===")
archive_path = "01-Work-工作记录/黑客松项目/会话记录"
save_project_config(project_root, archive_path)

archive_dir = VAULT_ROOT / archive_path
ensure_dir(archive_dir)

content = render_session_record(
    project="黑客松项目",
    topic="AI知识库智能体搭建",
    source="Kimi-Code-Session",
    background="参加公司黑客松，需要在1天内搭建AI知识库智能体的MVP",
    prompt="请帮我设计一个基于Markdown Vault的AI知识库系统架构",
    solution="采用双轴驱动模型：原料层和资产层分离，通过LLM自动提炼",
    optimization="使用Skill封装核心功能，支持多AI工具集成",
)
base_name = f"会话记录-{today_str()}-{sanitize_filename('AI知识库智能体搭建')}"
file_path = get_unique_path(archive_dir, base_name)
file_path.write_text(content, encoding="utf-8")
print(f"[OK] 已保存: {file_path}")

print("\n=== 测试 2: 二次记录（验证路径复用）===")
config = find_project_config(project_root)
print(f"[OK] 读取到配置: {config}")
assert config.get("session_archive_path") == archive_path, "路径记忆失败"
print("[OK] 路径复用验证通过")

print("\n=== 测试 3: 验证 AGENTS.md ===")
agents_md = project_root / "AGENTS.md"
assert agents_md.exists(), "AGENTS.md 未创建"
print(f"[OK] AGENTS.md 存在: {agents_md}")

print("\n=== 测试 4: 验证文件内容 ===")
saved_files = list(archive_dir.glob("*.md"))
assert len(saved_files) > 0, "未生成会话记录文件"
print(f"[OK] 发现 {len(saved_files)} 个会话记录文件")
for f in saved_files:
    content = f.read_text(encoding="utf-8")
    assert "---" in content, "缺少 YAML Frontmatter"
    assert "## 背景" in content, "缺少背景部分"
    assert "## Prompt" in content, "缺少 Prompt 部分"
    print(f"[OK] 内容验证通过: {f.name}")

print("\n[OK] 全部测试通过")
