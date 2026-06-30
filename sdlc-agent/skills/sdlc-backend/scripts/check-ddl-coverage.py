import re
import sys
from pathlib import Path

"""
校验脚本：比对数据库设计文档与 DDL 脚本，检测遗漏的表或字段
用法：python check-ddl-coverage.py <db_design_md> <init_sql>
返回：0 = 通过, 1 = 未通过
"""

def extract_tables_from_design(design_path):
    """从数据库设计文档中提取表名和字段"""
    tables = {}
    with open(design_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配表定义：通常以 "## 表名" 或 "### table_name" 开头
    table_pattern = re.compile(r'(?:#{2,3}\s+)([\w_]+)(?:\s*\(|\s*表|)')
    field_pattern = re.compile(r'\|\s*(\w+)\s*\|\s*(\w+)\s*\|')
    
    current_table = None
    for line in content.split('\n'):
        # 检测表名
        match = table_pattern.match(line)
        if match:
            current_table = match.group(1).lower()
            tables[current_table] = set()
        # 检测字段（在表格中）
        elif current_table and line.startswith('|'):
            fmatch = field_pattern.match(line)
            if fmatch:
                field_name = fmatch.group(1).lower()
                if field_name not in ['字段名', '列名', 'name', 'column']:
                    tables[current_table].add(field_name)
    
    return tables

def extract_tables_from_ddl(sql_path):
    """从 DDL 脚本中提取表名和字段"""
    tables = {}
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 匹配 CREATE TABLE 语句
    create_pattern = re.compile(
        r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\'"`]?(\w+)[\'"`]?\s*\((.+?)\)',
        re.IGNORECASE | re.DOTALL
    )
    
    for match in create_pattern.finditer(content):
        table_name = match.group(1).lower()
        body = match.group(2)
        fields = set()
        
        # 提取字段名（每行第一个词）
        for line in body.split(','):
            line = line.strip()
            if line and not line.startswith('CONSTRAINT') and not line.startswith('PRIMARY') and not line.startswith('FOREIGN') and not line.startswith('UNIQUE'):
                parts = line.split()
                if parts:
                    field_name = parts[0].strip('`"\'').lower()
                    if field_name and field_name not in ['create', 'table', 'index']:
                        fields.add(field_name)
        
        tables[table_name] = fields
    
    return tables

def check_coverage(design_tables, ddl_tables):
    """检查 DDL 是否覆盖设计文档"""
    missing_tables = set(design_tables.keys()) - set(ddl_tables.keys())
    extra_tables = set(ddl_tables.keys()) - set(design_tables.keys())
    
    missing_fields = {}
    for table, fields in design_tables.items():
        if table in ddl_tables:
            missing = fields - ddl_tables[table]
            if missing:
                missing_fields[table] = missing
    
    print(f"=== 数据库 DDL 覆盖率检查 ===")
    print(f"设计文档表数: {len(design_tables)}")
    print(f"DDL 脚本表数: {len(ddl_tables)}")
    print()
    
    if missing_tables:
        print(f"❌ DDL 缺少表 ({len(missing_tables)} 个)：")
        for t in sorted(missing_tables):
            print(f"   {t}")
    else:
        print("✅ DDL 包含所有设计文档中的表")
    
    print()
    
    if extra_tables:
        print(f"⚠️  DDL 中有设计文档未列出的表 ({len(extra_tables)} 个)：")
        for t in sorted(extra_tables):
            print(f"   {t}")
    
    print()
    
    if missing_fields:
        print(f"❌ 部分表缺少字段：")
        for table, fields in missing_fields.items():
            print(f"   {table}: {', '.join(sorted(fields))}")
    else:
        print("✅ 所有表字段完整")
    
    print()
    
    if missing_tables or missing_fields:
        print("❌ 未通过")
        return 1
    else:
        print("✅ 通过")
        return 0

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(f"用法: python {sys.argv[0]} <db_design_md> <init_sql>")
        sys.exit(1)
    
    design_file = sys.argv[1]
    sql_file = sys.argv[2]
    
    design_tables = extract_tables_from_design(design_file)
    ddl_tables = extract_tables_from_ddl(sql_file)
    
    exit_code = check_coverage(design_tables, ddl_tables)
    sys.exit(exit_code)
