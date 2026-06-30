import re
import sys
from pathlib import Path

"""
校验脚本：检查后端的 API 实现是否与 API 契约一致
用法：python check-api-contract.py <backend_dir> <api_contract_yaml>
返回：0 = 通过, 1 = 未通过
"""

def parse_api_contract(contract_path):
    """解析 api-contract.yaml"""
    endpoints = {}
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    current = None
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('- id:'):
            current = {}
        elif current is not None:
            if line.startswith('path:'):
                current['path'] = line.split(':', 1)[1].strip().strip('"')
            elif line.startswith('method:'):
                current['method'] = line.split(':', 1)[1].strip().strip('"').upper()
            elif line.startswith('id:'):
                eid = line.split(':', 1)[1].strip().strip('"')
                if 'path' in current and 'method' in current:
                    key = f"{current['method']} {current['path']}"
                    endpoints[key] = current
                current = None
    
    return endpoints

def extract_backend_routes(backend_dir):
    """从后端代码中提取路由/控制器定义"""
    routes = []
    backend_path = Path(backend_dir)
    
    # 各种后端框架的路由模式
    patterns = [
        # Spring Boot: @GetMapping("/users"), @RequestMapping("/api")
        re.compile(r'@(?:Get|Post|Put|Delete|Request|Patch)Mapping\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'),
        # FastAPI/Flask: @app.get("/users")
        re.compile(r'@(?:app|router)\.\s*(?:get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'),
        # Express: router.get('/users', ...)
        re.compile(r'(?:router|app)\.\s*(?:get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'),
        # Go Gin: router.GET("/users", ...)
        re.compile(r'(?:router|engine|group)\.\s*(?:GET|POST|PUT|DELETE|PATCH)\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'),
    ]
    
    # 方法推断映射
    method_map = {
        'get': 'GET', 'post': 'POST', 'put': 'PUT', 'delete': 'DELETE', 'patch': 'PATCH',
        'Get': 'GET', 'Post': 'POST', 'Put': 'PUT', 'Delete': 'DELETE', 'Patch': 'PATCH',
        'GET': 'GET', 'POST': 'POST', 'PUT': 'PUT', 'DELETE': 'DELETE', 'PATCH': 'PATCH',
    }
    
    for file_path in backend_path.rglob('*'):
        if file_path.suffix in ['.java', '.py', '.js', '.ts', '.go']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                for pattern in patterns:
                    for match in pattern.finditer(content):
                        full_match = match.group(0)
                        path = match.group(1)
                        # 推断方法
                        method = 'GET'
                        for key, val in method_map.items():
                            if key in full_match.lower().split('.')[-1] or key in full_match:
                                method = val
                                break
                        routes.append(f"{method} {path}")
            except Exception:
                continue
    
    return list(set(routes))

def check_contract(backend_routes, contract_endpoints):
    """比对后端路由与契约"""
    contract_keys = set(contract_endpoints.keys())
    route_keys = set(backend_routes)
    
    missing_in_backend = contract_keys - route_keys
    missing_in_contract = route_keys - contract_keys
    
    print(f"=== 后端 API 契约一致性检查 ===")
    print(f"契约端点总数: {len(contract_keys)}")
    print(f"后端实现端点: {len(route_keys)}")
    print()
    
    if missing_in_backend:
        print(f"❌ 契约中定义但后端未实现的 API ({len(missing_in_backend)} 个)：")
        for api in sorted(missing_in_backend):
            print(f"   {api}")
    else:
        print("✅ 所有契约端点都有后端实现")
    
    print()
    
    if missing_in_contract:
        print(f"⚠️  后端实现了契约中不存在的 API ({len(missing_in_contract)} 个)：")
        for api in sorted(missing_in_contract):
            print(f"   {api}")
    else:
        print("✅ 后端没有虚构 API")
    
    print()
    
    if missing_in_backend:
        print("❌ 未通过：后端实现不完整")
        return 1
    else:
        print("✅ 通过")
        return 0

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"用法: python {sys.argv[0]} <backend_dir> <api_contract_yaml>")
        sys.exit(1)
    
    backend_dir = sys.argv[1]
    contract_file = sys.argv[2]
    
    endpoints = parse_api_contract(contract_file)
    routes = extract_backend_routes(backend_dir)
    
    exit_code = check_contract(routes, endpoints)
    sys.exit(exit_code)
