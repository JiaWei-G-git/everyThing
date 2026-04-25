"""通用工具函数"""
import re
from pathlib import Path
from datetime import datetime


def sanitize_filename(name: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "-", name).strip("- ")


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_unique_path(directory: Path, base_name: str, suffix: str = ".md") -> Path:
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
