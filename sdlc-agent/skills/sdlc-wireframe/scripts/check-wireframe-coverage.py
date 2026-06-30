import re
import sys
from pathlib import Path

"""
校验脚本：检查原型页面是否覆盖 PRD 中的所有功能点
用法：python check-wireframe-coverage.py <prd_file> <wireframe_file>
返回：0 = 通过, 1 = 未通过
"""

def extract_features_from_prd(prd_path):
    """从 PRD 中提取功能点列表（带 REQ-ID 的条目）"""
    features = []
    with open(prd_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配 REQ-ID 格式：REQ-XXX-NNN
    req_pattern = re.compile(r'(REQ-[A-Z]+-\d+)\s*[:\-]\s*(.+?)(?:\n|$)', re.MULTILINE)
    for match in req_pattern.finditer(content):
        req_id = match.group(1).strip()
        desc = match.group(2).strip()
        features.append({"id": req_id, "desc": desc})
    
    return features

def extract_pages_from_wireframe(wf_path):
    """从原型文档中提取页面列表"""
    pages = []
    with open(wf_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配页面结构清单中的页面名称（Markdown 表格的 Page Name 列）
    # 假设表格格式：| Page Name | ... |
    table_pattern = re.compile(r'\|\s*([^|]+?)\s*\|\s*[^|]*\|')
    lines = content.split('\n')
    in_table = False
    for line in lines:
        if '| Page Name' in line or '| 页面名称' in line:
            in_table = True
            continue
        if in_table and line.startswith('|'):
            match = table_pattern.match(line)
            if match:
                page_name = match.group(1).strip()
                if page_name and page_name not in ['Page Name', '页面名称', '---']:
                    pages.append(page_name)
        elif in_table and not line.startswith('|'):
            in_table = False
    
    # 也尝试提取 ## 标题中的页面名
    heading_pattern = re.compile(r'^##+\s+(.+?页面?|.+?管理|.+?列表|.+?详情|.+?表单)')
    for line in lines:
        match = heading_pattern.match(line)
        if match:
            pages.append(match.group(1).strip())
    
    return list(set(pages))

def check_coverage(prd_features, wireframe_pages):
    """检查覆盖率并报告"""
    covered = 0
    uncovered = []
    
    for feature in prd_features:
        # 简单匹配：看功能描述的关键词是否出现在页面名中
        feature_keywords = set(feature["desc"].lower().split())
        found = False
        for page in wireframe_pages:
            page_keywords = set(page.lower().split())
            if feature_keywords & page_keywords:
                found = True
                break
        if found:
            covered += 1
        else:
            uncovered.append(feature)
    
    total = len(prd_features)
    coverage = (covered / total * 100) if total > 0 else 0
    
    print(f"=== 原型覆盖率检查 ===")
    print(f"PRD 功能点总数: {total}")
    print(f"已覆盖: {covered}")
    print(f"未覆盖: {len(uncovered)}")
    print(f"覆盖率: {coverage:.1f}%")
    print(f"目标: ≥95%")
    print()
    
    if uncovered:
        print("未覆盖的功能点：")
        for f in uncovered:
            print(f"  - {f['id']}: {f['desc']}")
    
    if coverage >= 95:
        print("✅ 通过")
        return 0
    else:
        print("❌ 未通过，请补充原型页面")
        return 1

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"用法: python {sys.argv[0]} <prd_file> <wireframe_file>")
        sys.exit(1)
    
    prd_file = sys.argv[1]
    wf_file = sys.argv[2]
    
    features = extract_features_from_prd(prd_file)
    pages = extract_pages_from_wireframe(wf_file)
    
    exit_code = check_coverage(features, pages)
    sys.exit(exit_code)
