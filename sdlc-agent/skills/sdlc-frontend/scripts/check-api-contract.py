import re
import sys
from pathlib import Path

"""
校验脚本：检查前端代码中的 API 调用是否与 API 契约一致
用法：python check-api-contract.py <frontend_dir> <api_contract_yaml>
返回：0 = 通过, 1 = 未通过
"""

def parse_api_contract(contract_path):
    """解析 api-contract.yaml，提取所有 endpoint 定义"""
    endpoints = {}
    with open(contract_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 简单 YAML 解析：提取 path 和 method
    current_endpoint = None
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('- id:'):
            current_endpoint = {}
        elif current_endpoint is not None:
            if line.startswith('path:'):
                current_endpoint['path'] = line.split(':', 1)[1].strip().strip('"')
            elif line.startswith('method:'):
                current_endpoint['method'] = line.split(':', 1)[1].strip().strip('"').upper()
            elif line.startswith('id:'):
                endpoint_id = line.split(':', 1)[1].strip().strip('"')
                current_endpoint['id'] = endpoint_id
                if 'path' in current_endpoint and 'method' in current_endpoint:
                    key = f"{current_endpoint['method']} {current_endpoint['path']}"
                    endpoints[key] = current_endpoint
                current_endpoint = None
    
    return endpoints

def extract_api_calls_from_frontend(frontend_dir):
    """从前端代码中提取 API 调用"""
    calls = []
    frontend_path = Path(frontend_dir)
    
    # 扫描常见的 API 调用模式
    patterns = [
        # axios: axios.get('/api/users'), axios.post('/api/users', ...)
        re.compile(r'(?:axios|api|request|fetch)\.(?:get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]'),
        # 直接字符串: '/api/users' 或 '/api/v1/users'
        re.compile(r'[\'"](/api/[^\'"]+)[\'"]'),
        # service 方法调用: getUserList, createUser
        re.compile(r'(?:get|post|put|delete|fetch)(\w+)\s*\('),
    ]
    
    for file_path in frontend_path.rglob('*'):
        if file_path.suffix in ['.js', '.ts', '.tsx', '.vue', '.jsx']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                for pattern in patterns:
                    for match in pattern.finditer(content):
                        path = match.group(1)
                        # 尝试推断 method
                        method = 'GET'  # 默认
                        if 'post' in match.group(0).lower() or 'create' in path.lower():
                            method = 'POST'
                        elif 'put' in match.group(0).lower() or 'update' in path.lower():
                            method = 'PUT'
                        elif 'delete' in match.group(0).lower() or 'remove' in path.lower():
                            method = 'DELETE'
                        calls.append(f"{method} {path}")
            except Exception:
                continue
    
    return list(set(calls))

def check_contract(frontend_calls, contract_endpoints):
    """比对前端调用与契约定义"""
    contract_keys = set(contract_endpoints.keys())
    call_keys = set(frontend_calls)
    
    missing_in_contract = call_keys - contract_keys
    missing_in_frontend = contract_keys - call_keys
    
    print(f"=== API 契约一致性检查 ===")
    print(f"契约端点总数: {len(contract_keys)}")
    print(f"前端调用总数: {len(call_keys)}")
    print()
    
    if missing_in_contract:
        print(f"❌ 前端调用了契约中不存在的 API ({len(missing_in_contract)} 个)：")
        for api in sorted(missing_in_contract):
            print(f"   {api}")
    else:
        print("✅ 前端所有调用都在契约中")
    
    print()
    
    if missing_in_frontend:
        print(f"⚠️  契约中定义的 API 未在前端调用 ({len(missing_in_frontend)} 个)：")
        for api in sorted(missing_in_frontend):
            print(f"   {api}")
    else:
        print("✅ 所有契约端点都在前端有调用")
    
    print()
    
    if missing_in_contract:
        print("❌ 未通过：前端存在虚构 API 调用")
        return 1
    else:
        print("✅ 通过")
        return 0

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"用法: python {sys.argv[0]} <frontend_dir> <api_contract_yaml>")
        sys.exit(1)
    
    frontend_dir = sys.argv[1]
    contract_file = sys.argv[2]
    
    endpoints = parse_api_contract(contract_file)
    calls = extract_api_calls_from_frontend(frontend_dir)
    
    exit_code = check_contract(calls, endpoints)
    sys.exit(exit_code)
