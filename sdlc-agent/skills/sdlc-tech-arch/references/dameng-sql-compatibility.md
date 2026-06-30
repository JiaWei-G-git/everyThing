# 达梦数据库 (DM8) SQL 兼容性说明

## 背景
达梦数据库是国产关系型数据库，语法兼容 Oracle 为主，同时兼容 MySQL 和 PostgreSQL 模式。在 South Grid 国产化项目中常用。

## 兼容性模式

达梦支持三种兼容模式：
- **Oracle 模式**（默认）：PL/SQL 兼容
- **MySQL 模式**：MySQL 语法兼容
- **PostgreSQL 模式**：PG 语法兼容

**建议**：新项目使用 Oracle 兼容模式（默认），Oracle 迁移项目保持一致。

## 与标准 Oracle 的差异

### 1. 自增字段
**达梦使用 IDENTITY 或 SEQUENCE**

```sql
-- ✅ 达梦支持：IDENTITY 列
CREATE TABLE users (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- ✅ 达梦支持：SEQUENCE
CREATE SEQUENCE seq_users START WITH 1 INCREMENT BY 1;
CREATE TABLE users (
    id INT DEFAULT seq_users.NEXTVAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- ❌ 不支持 SERIAL（PostgreSQL 语法）
```

### 2. 分页语法
**达梦支持多种分页方式**

```sql
-- ✅ 方式 1：LIMIT（MySQL 兼容模式）
SELECT * FROM users LIMIT 10 OFFSET 20;

-- ✅ 方式 2：ROWNUM（Oracle 兼容模式）
SELECT * FROM (
    SELECT ROWNUM AS rn, t.* FROM users t WHERE ROWNUM <= 30
) WHERE rn > 20;

-- ✅ 方式 3：ROW_NUMBER()（标准 SQL）
SELECT * FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY id) AS rn, t.* FROM users t
) WHERE rn BETWEEN 21 AND 30;

-- ✅ 方式 4：OFFSET FETCH（Oracle 12c+ 语法）
SELECT * FROM users ORDER BY id OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;
```

### 3. 字符串连接
**达梦使用 `||` 或 `CONCAT()`**

```sql
-- ✅ 达梦支持
SELECT 'Hello' || ' ' || 'World' FROM DUAL;
SELECT CONCAT('Hello', ' ', 'World') FROM DUAL;
```

### 4. 日期函数
**达梦兼容 Oracle 日期函数**

```sql
-- ✅ 达梦支持
SELECT SYSDATE FROM DUAL;
SELECT SYSTIMESTAMP FROM DUAL;
SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL;
SELECT TO_DATE('2025-06-29', 'YYYY-MM-DD') FROM DUAL;
SELECT ADD_MONTHS(SYSDATE, 1) FROM DUAL;
SELECT TRUNC(SYSDATE, 'MONTH') FROM DUAL;
```

### 5. 类型转换
**达梦使用 CAST() 或 TO_xxx()**

```sql
-- ✅ 达梦支持
SELECT CAST('123' AS INT) FROM DUAL;
SELECT TO_NUMBER('123') FROM DUAL;
SELECT TO_CHAR(123) FROM DUAL;
SELECT TO_DATE('2025-06-29', 'YYYY-MM-DD') FROM DUAL;
```

### 6. DUAL 表
**达梦支持 DUAL 表（Oracle 兼容）**

```sql
-- ✅ 达梦支持
SELECT 1 FROM DUAL;
SELECT SYSDATE FROM DUAL;
```

### 7. 存储过程和函数
**达梦支持 PL/SQL 语法**

```sql
-- ✅ 达梦支持
CREATE OR REPLACE PROCEDURE sp_get_user(p_id IN INT) AS
BEGIN
    SELECT * FROM users WHERE id = p_id;
END;
/
```

## 自动生成 DDL 时的处理规则

1. **数据库类型检测**：如果项目配置中 database 包含 "达梦" 或 "dameng"，启用达梦兼容模式
2. **SERIAL 自动替换**：自动转换为 `IDENTITY(1,1)` 或 `SEQUENCE`
3. **LIMIT 自动转换**：根据兼容模式选择合适的分页语法（默认使用 `OFFSET FETCH`）
4. **DUAL 表**：系统函数查询自动添加 `FROM DUAL`
5. **函数替换**：
   - `NOW()` → `SYSDATE`（日期）或 `SYSTIMESTAMP`（时间戳）
   - `LENGTH()` → `LENGTH()`（兼容）
   - `SUBSTRING()` → `SUBSTR()`

## 快速对照表

| 语法 | Oracle | 达梦 | MySQL | PostgreSQL |
|------|--------|------|-------|------------|
| 自增 | SEQUENCE | IDENTITY/SEQUENCE | AUTO_INCREMENT | SERIAL |
| 分页 | ROWNUM / OFFSET FETCH | 全部支持 | LIMIT | LIMIT/OFFSET |
| 字符串连接 | \|\| | \|\| / CONCAT() | CONCAT() | \|\| / CONCAT() |
| 当前日期 | SYSDATE | SYSDATE | NOW() | NOW() |
| 空值处理 | NVL() | NVL() / IFNULL() | IFNULL() | COALESCE() |
| 伪表 | DUAL | DUAL | 不需要 | 不需要 |

## 参考
- 达梦官方文档：https://www.dameng.com/
