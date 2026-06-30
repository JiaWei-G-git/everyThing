import re
import sys
from pathlib import Path

"""
校验脚本：扫描前端路由配置，检测重复或冲突的路由
用法：python check-route-conflict.py <frontend_dir>
返回：0 = 通过, 1 = 未通过
"""

def extract_routes(frontend_dir):
    """从前端代码中提取路由定义"""
    routes = []
    frontend_path = Path(frontend_dir)
    
    # 路由模式匹配
    patterns = [
        # React Router: <Route path="/users" />
        re.compile(r'(?:path|to)\s*[:=]\s*[\'"]([^\'"]+)[\'"]'),
        # Vue Router: { path: '/users', component: ... }
        re.compile(r'path\s*:\s*[\'"]([^\'"]+)[\'"]'),
        # 手动路由配置对象
        re.compile(r'[\'"]([^\'"]+)[\'"]\s*:\s*\w+Page'),
    ]
    
    for file_path in frontend_path.rglob('*'):
        if file_path.suffix in ['.js', '.ts', '.tsx', '.vue', '.jsx']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                for pattern in patterns:
                    for match in pattern.finditer(content):
                        path = match.group(1)
                        # 过滤非路由路径
                        if path.startswith('/') or path.startswith('./'):
                            routes.append(path)
            except Exception:
                continue
    
    return routes

def check_conflicts(routes):
    """检测路由冲突"""
    seen = {}
    conflicts = []
    
    for route in routes:
        normalized = route.rstrip('/')
        if normalized in seen:
            conflicts.append((normalized, seen[normalized]))
        else:
            seen[normalized] = route
    
    print(f"=== 路由冲突检查 ===")
    print(f"发现路由总数: {len(routes)}")
    print(f"唯一路由数: {len(seen)}")
    print()
    
    if conflicts:
        print(f"❌ 发现 {len(conflicts)} 个路由冲突：")
        for route, first in conflicts:
            print(f"   重复路由: {route}")
    else:
        print("✅ 未发现路由冲突")
    
    print()
    
    # 检查潜在冲突：/users 和 /users/:id 不算冲突，但 /users 和 /users/detail 可能有问题
    for route in sorted(seen.keys()):
        for other in sorted(seen.keys()):
            if route != other and route.startswith(other + '/') and not other.endswith('/:'):
                print(f"⚠️  潜在路由冲突: {other} 与 {route}")
    
    if conflicts:
        return 1
    return 0

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"用法: python {sys.argv[0]} <frontend_dir>")
        sys.exit(1)
    
    frontend_dir = sys.argv[1]
    routes = extract_routes(frontend_dir)
    exit_code = check_conflicts(routes)
    sys.exit(exit_code)
