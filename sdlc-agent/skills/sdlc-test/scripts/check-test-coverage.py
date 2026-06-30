import re
import sys
from pathlib import Path

"""
校验脚本：检查测试用例对 PRD 需求的覆盖率
用法：python check-test-coverage.py <prd_file> <test_report_md>
返回：0 = 通过(≥80%), 1 = 未通过
"""

def extract_req_ids(prd_path):
    """从 PRD 中提取所有 REQ-ID"""
    req_ids = set()
    with open(prd_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = re.compile(r'(REQ-[A-Z]+-\d+)')
    for match in pattern.finditer(content):
        req_ids.add(match.group(1))
    
    return req_ids

def extract_tested_reqs(test_report_path):
    """从测试报告中提取已测试的 REQ-ID"""
    tested = set()
    with open(test_report_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = re.compile(r'(REQ-[A-Z]+-\d+)')
    for match in pattern.finditer(content):
        tested.add(match.group(1))
    
    return tested

def check_coverage(prd_reqs, tested_reqs):
    """计算并报告覆盖率"""
    total = len(prd_reqs)
    tested = len(prd_reqs & tested_reqs)
    coverage = (tested / total * 100) if total > 0 else 0
    
    missing = prd_reqs - tested_reqs
    
    print(f"=== 测试覆盖率检查 ===")
    print(f"PRD 需求总数: {total}")
    print(f"已测试需求: {tested}")
    print(f"未测试需求: {len(missing)}")
    print(f"覆盖率: {coverage:.1f}%")
    print(f"目标: ≥80%")
    print()
    
    if missing:
        print("未覆盖的需求：")
        for req in sorted(missing):
            print(f"  - {req}")
    
    print()
    
    if coverage >= 80:
        print("✅ 通过")
        return 0
    else:
        print("❌ 未通过，请补充测试用例")
        return 1

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"用法: python {sys.argv[0]} <prd_file> <test_report_md>")
        sys.exit(1)
    
    prd_file = sys.argv[1]
    test_file = sys.argv[2]
    
    prd_reqs = extract_req_ids(prd_file)
    tested_reqs = extract_tested_reqs(test_file)
    
    exit_code = check_coverage(prd_reqs, tested_reqs)
    sys.exit(exit_code)
