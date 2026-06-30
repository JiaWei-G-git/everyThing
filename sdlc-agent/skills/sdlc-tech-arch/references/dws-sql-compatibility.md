# DWS (华为分布式数据仓库) SQL 兼容性说明

## 背景
DWS 是基于 PostgreSQL 内核的分布式数据库，部分语法与标准 PostgreSQL 有差异。在 South Grid 项目中如需使用 DWS，需特别注意以下兼容性事项。

## 与标准 PostgreSQL 的差异

### 1. REPLACE 语法
**DWS 不支持 `REPLACE INTO`**

```sql
-- ❌ DWS 不支持
REPLACE INTO users (id, name) VALUES (1, '张三');

-- ✅ DWS 兼容写法：INSERT ON CONFLICT
INSERT INTO users (id, name) VALUES (1, '张三')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ✅ 或先 DELETE 再 INSERT（不推荐，有并发问题）
DELETE FROM users WHERE id = 1;
INSERT INTO users (id, name) VALUES (1, '张三');
```

### 2. MERGE 语法
**DWS 支持 MERGE（有限支持）**

```sql
-- ✅ DWS 支持（但需确认版本）
MERGE INTO target_table t
USING source_table s ON t.id = s.id
WHEN MATCHED THEN UPDATE SET t.name = s.name
WHEN NOT MATCHED THEN INSERT (id, name) VALUES (s.id, s.name);
```

### 3. LIMIT 语法
**DWS 支持标准 LIMIT/OFFSET**

```sql
-- ✅ DWS 支持
SELECT * FROM users LIMIT 10 OFFSET 20;
```

### 4. 自增字段
**DWS 使用 SERIAL/BIGSERIAL**

```sql
-- ✅ DWS 支持
CREATE TABLE users (
    id SERIAL PRIMARY KEY,        -- 或使用 BIGSERIAL
    name VARCHAR(100) NOT NULL
);

-- ❌ 不支持 AUTO_INCREMENT（MySQL 语法）
```

### 5. 字符串连接
**DWS 使用 `||` 或 `CONCAT()`**

```sql
-- ✅ DWS 支持
SELECT 'Hello' || ' ' || 'World';
SELECT CONCAT('Hello', ' ', 'World');

-- ❌ 不支持 `+` 连接字符串（SQL Server 语法）
```

### 6. 日期函数
**DWS 使用标准 PostgreSQL 日期函数**

```sql
-- ✅ DWS 支持
SELECT NOW();
SELECT CURRENT_DATE;
SELECT CURRENT_TIMESTAMP;
SELECT AGE('2025-06-29', '2025-01-01');
```

### 7. 类型转换
**DWS 使用 `::` 或 CAST()**

```sql
-- ✅ DWS 支持
SELECT '123'::INT;
SELECT CAST('123' AS INT);

-- ❌ 不支持 CONVERT()（SQL Server 语法）
```

### 8. 分布式注意事项

- **分布键**：DWS 是分布式数据库，CREATE TABLE 时必须指定 DISTRIBUTE BY 或作为分布键的 PRIMARY KEY
  ```sql
  CREATE TABLE users (
      id BIGSERIAL PRIMARY KEY,  -- 主键自动作为分布键
      name VARCHAR(100)
  ) DISTRIBUTE BY HASH(id);      -- 显式指定分布键
  ```

- **本地表 vs 全局表**：小维度表（如字典表）建议用 REPLICATION 分布模式
  ```sql
  CREATE TABLE dict_org (
      id INT PRIMARY KEY,
      name VARCHAR(100)
  ) DISTRIBUTE BY REPLICATION;   -- 全节点复制，JOIN 性能更好
  ```

- **JOIN 优化**：大表 JOIN 需确保分布键一致，否则产生数据重分布，性能下降

## 自动生成 DDL 时的处理规则

1. **数据库类型检测**：如果项目配置中 database 包含 "dws" 或 "华为"，启用 DWS 兼容模式
2. **REPLACE 自动替换**：检测到 `REPLACE INTO` 时，自动转换为 `INSERT ON CONFLICT`
3. **AUTO_INCREMENT 自动替换**：自动转换为 `SERIAL` 或 `BIGSERIAL`
4. **分布键自动添加**：为主键表自动添加 `DISTRIBUTE BY HASH(主键)`
5. **小表检测**：记录数 < 10000 的表建议 `DISTRIBUTE BY REPLICATION`

## 快速对照表

| 语法 | MySQL | PostgreSQL/DWS | Oracle | SQL Server |
|------|-------|-----------------|--------|------------|
| 自增 | AUTO_INCREMENT | SERIAL | SEQUENCE | IDENTITY |
| 字符串连接 | CONCAT() | \|\| / CONCAT() | \|\| | + |
| 类型转换 | CAST() | CAST() / :: | CAST() | CAST() / CONVERT() |
| 分页 | LIMIT n, m | LIMIT n OFFSET m | ROWNUM | OFFSET FETCH |
| 当前时间 | NOW() | NOW() / CURRENT_TIMESTAMP | SYSDATE | GETDATE() |
| 日期格式化 | DATE_FORMAT() | TO_CHAR() | TO_CHAR() | FORMAT() |
| 空值处理 | IFNULL() | COALESCE() | NVL() | ISNULL() |

## 参考
- DWS 官方文档：https://support.huaweicloud.com/productdesc-dws/
