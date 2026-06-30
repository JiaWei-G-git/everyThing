import re
import sys
from pathlib import Path

"""
安全编码扫描脚本：检测 SQL 注入、XSS、明文密钥存储等风险
用法：python check-security.py <backend_dir> [frontend_dir]
返回：0 = 通过, 1 = 发现风险
"""

# SQL 注入风险模式
SQL_INJECTION_PATTERNS = [
    # 字符串拼接 SQL（高危险）
    re.compile(r'["\']\s*\+\s*\w+\s*\+\s*["\']', re.IGNORECASE),  # "SELECT * FROM " + table
    re.compile(r'\.format\s*\([^)]*\)', re.IGNORECASE),  # "SELECT {}".format(...)
    re.compile(r'f["\'][^"\']*\{[^}]+\}[^"\']*["\']', re.IGNORECASE),  # f"SELECT {field}"
    re.compile(r'string\.format\s*\(', re.IGNORECASE),
    # Java 中的 + 拼接
    re.compile(r'"[^"]*\$\{[^}]+\}"', re.IGNORECASE),  # "SELECT ${field}"
]

# XSS 风险模式
XSS_PATTERNS = [
    re.compile(r'dangerouslySetInnerHTML', re.IGNORECASE),  # React
    re.compile(r'innerHTML\s*=\s*', re.IGNORECASE),  # 原生 JS
    re.compile(r'document\.write\s*\(', re.IGNORECASE),
    re.compile(r'\$\s*\([^)]*\)\.html\s*\(', re.IGNORECASE),  # jQuery .html()
]

# 密钥/密码硬编码模式
SECRET_PATTERNS = [
    re.compile(r'(?:password|passwd|pwd|secret|token|key|api_key)\s*[:=]\s*["\'][^"\']{4,}["\']', re.IGNORECASE),
    re.compile(r'(?:admin|root)\s*[:=]\s*["\'][^"\']{4,}["\']', re.IGNORECASE),
]

# 安全敏感的正则（排除测试文件和配置中的占位符）
EXCLUDE_PATTERNS = [
    re.compile(r'\.(test|spec)\.(js|ts|py|java|go)$', re.IGNORECASE),  # 测试文件
    re.compile(r'example|placeholder|dummy|mock|test|demo', re.IGNORECASE),  # 占位符
    re.compile(r'your_|YOUR_|配置|config|TODO|FIXME', re.IGNORECASE),  # 配置提示
]

def is_excluded(content, file_path):
    """检查是否应排除（测试文件、占位符）"""
    path_str = str(file_path).lower()
    if 'test' in path_str or 'mock' in path_str or 'spec' in path_str:
        return True
    for pattern in EXCLUDE_PATTERNS:
        if pattern.search(content):
            return True
    return False

def scan_file(file_path, backend=True):
    """扫描单个文件"""
    risks = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return risks
    
    if is_excluded(content, file_path):
        return risks
    
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        # SQL 注入检查（仅后端）
        if backend:
            for pattern in SQL_INJECTION_PATTERNS:
                if pattern.search(line):
                    # 排除注释行
                    stripped = line.strip()
                    if not stripped.startswith('//') and not stripped.startswith('#') and not stripped.startswith('*') and not stripped.startswith('/*'):
                        # 检查是否使用了参数化查询（PreparedStatement、? 占位符、ORM）
                        if '?' not in line and 'PreparedStatement' not in line and 'Query' not in line and 'param' not in line.lower() and 'bind' not in line.lower():
                            risks.append({
                                'line': i,
                                'type': 'SQL 注入风险',
                                'content': line.strip()[:80]
                            })
        
        # XSS 检查（前端 + 后端模板）
        for pattern in XSS_PATTERNS:
            if pattern.search(line):
                risks.append({
                    'line': i,
                    'type': 'XSS 风险',
                    'content': line.strip()[:80]
                })
        
        # 密钥硬编码检查
        for pattern in SECRET_PATTERNS:
            if pattern.search(line):
                # 排除环境变量引用和配置文件占位符
                if 'env' not in line.lower() and 'getenv' not in line.lower() and 'config' not in line.lower() and 'properties' not in line.lower():
                    risks.append({
                        'line': i,
                        'type': '硬编码密钥/密码',
                        'content': line.strip()[:80]
                    })
    
    return risks

def scan_directory(dir_path, backend=True):
    """扫描目录下所有代码文件"""
    all_risks = []
    path = Path(dir_path)
    
    extensions = ['.java', '.py', '.js', '.ts', '.go', '.vue', '.jsx', '.tsx']
    
    for file_path in path.rglob('*'):
        if file_path.suffix in extensions:
            risks = scan_file(file_path, backend)
            for risk in risks:
                risk['file'] = str(file_path.relative_to(path))
                all_risks.append(risk)
    
    return all_risks

def print_report(risks):
    """输出报告"""
    print(f"=== 安全编码扫描报告 ===")
    print(f"扫描文件数: {len(set(r['file'] for r in risks))}")
    print(f"发现问题数: {len(risks)}")
    print()
    
    if not risks:
        print("✅ 未发现安全风险")
        return 0
    
    # 按类型分组
    by_type = {}
    for risk in risks:
        by_type.setdefault(risk['type'], []).append(risk)
    
    for risk_type, items in by_type.items():
        print(f"\n【{risk_type}】({len(items)} 个)")
        for item in items:
            print(f"  {item['file']}:{item['line']}")
            print(f"    {item['content']}")
    
    print(f"\n❌ 发现 {len(risks)} 个安全风险，需要修复")
    return 1

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"用法: python {sys.argv[0]} <backend_dir> [frontend_dir]")
        sys.exit(1)
    
    backend_dir = sys.argv[1]
    all_risks = scan_directory(backend_dir, backend=True)
    
    if len(sys.argv) > 2:
        frontend_dir = sys.argv[2]
        all_risks.extend(scan_directory(frontend_dir, backend=False))
    
    exit_code = print_report(all_risks)
    sys.exit(exit_code)
