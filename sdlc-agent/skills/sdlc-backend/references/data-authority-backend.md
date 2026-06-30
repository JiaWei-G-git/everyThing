# 数据权限（行级过滤）后端实现

## 概述
数据权限实现：按组织层级（省/地市/区县/班组/供电所）进行行级数据隔离。用户只能看到本层级及下级数据。

## 核心设计

### 1. 组织层级表

```sql
CREATE TABLE sys_org (
    id BIGINT PRIMARY KEY,
    org_code VARCHAR(50) NOT NULL UNIQUE,    -- 组织编码，如 GD-GZ-TH
    org_name VARCHAR(100) NOT NULL,          -- 组织名称
    org_type VARCHAR(20) NOT NULL,           -- province/city/district/team/station
    parent_id BIGINT,                         -- 父组织ID
    level INT NOT NULL,                      -- 层级：1=省 2=地市 3=区县 4=班组 5=供电所
    path VARCHAR(500) NOT NULL,              -- 层级路径：1.2.3.4
    sort_order INT DEFAULT 0,
    status TINYINT DEFAULT 1
);

-- 示例数据
INSERT INTO sys_org VALUES 
(1, 'GD', '广东省', 'province', NULL, 1, '1.', 1, 1),
(2, 'GD-GZ', '广州市', 'city', 1, 2, '1.2.', 1, 1),
(3, 'GD-GZ-TH', '天河区', 'district', 2, 3, '1.2.3.', 1, 1),
(4, 'GD-GZ-TH-001', '天河班组1', 'team', 3, 4, '1.2.3.4.', 1, 1),
(5, 'GD-GZ-TH-001-001', '天河供电所1', 'station', 4, 5, '1.2.3.4.5.', 1, 1);
```

### 2. 业务表数据权限字段

所有业务表必须包含 `org_id` 字段：

```sql
CREATE TABLE biz_meter_data (
    id BIGINT PRIMARY KEY,
    meter_id BIGINT NOT NULL,
    reading_value DECIMAL(18, 4),
    reading_time TIMESTAMP,
    org_id BIGINT NOT NULL,                  -- 数据所属组织
    create_by BIGINT,
    create_time TIMESTAMP
);
```

### 3. 数据权限过滤规则

| 用户层级 | 数据范围 | 过滤条件 |
|---------|---------|---------|
| 省级 (level=1) | 全省 | 无过滤 或 `org_id` 任意 |
| 地市 (level=2) | 本市 | `org_id` 的 `path` 以 `1.2.` 开头 |
| 区县 (level=3) | 本区县 | `org_id` 的 `path` 以 `1.2.3.` 开头 |
| 班组 (level=4) | 本班组 | `org_id` 的 `path` 以 `1.2.3.4.` 开头 |
| 供电所 (level=5) | 本供电所 | `org_id = 5` |

### 4. MyBatis 拦截器实现（Spring Boot）

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query", 
               args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
@Component
public class DataAuthorityInterceptor implements Interceptor {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrgService orgService;
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        Object parameter = args[1];
        
        // 获取当前用户
        Long userId = SecurityContextHolder.getCurrentUserId();
        if (userId == null) {
            return invocation.proceed();
        }
        
        User user = userService.getById(userId);
        if (user == null || user.isSuperAdmin()) {
            return invocation.proceed(); // 超管不过滤
        }
        
        // 获取用户组织
        Org userOrg = orgService.getById(user.getOrgId());
        if (userOrg == null) {
            return invocation.proceed();
        }
        
        // 获取 SQL 信息
        BoundSql boundSql = ms.getBoundSql(parameter);
        String originalSql = boundSql.getSql();
        
        // 检查是否是需要数据权限的表
        if (!needsDataAuthority(ms.getId())) {
            return invocation.proceed();
        }
        
        // 构建数据权限过滤 SQL
        String dataAuthSql = buildDataAuthoritySql(userOrg);
        
        // 修改 SQL：添加 WHERE 条件
        String modifiedSql = addDataAuthorityCondition(originalSql, dataAuthSql);
        
        // 重建 BoundSql
        BoundSql newBoundSql = new BoundSql(ms.getConfiguration(), modifiedSql, 
                                            boundSql.getParameterMappings(), parameter);
        
        // 复制参数
        boundSql.getParameterMappings().forEach(pm -> {
            newBoundSql.setAdditionalParameter(pm.getProperty(), boundSql.getAdditionalParameter(pm.getProperty()));
        });
        
        // 构建新的 MappedStatement
        MappedStatement newMs = copyMappedStatement(ms, new BoundSqlSource(newBoundSql));
        args[0] = newMs;
        
        return invocation.proceed();
    }
    
    private String buildDataAuthoritySql(Org userOrg) {
        // 本级及下级数据
        return String.format(
            "org_id IN (SELECT id FROM sys_org WHERE path LIKE '%s%%')",
            userOrg.getPath()
        );
    }
    
    private String addDataAuthorityCondition(String sql, String condition) {
        if (sql.toUpperCase().contains(" WHERE ")) {
            return sql + " AND " + condition;
        } else {
            return sql + " WHERE " + condition;
        }
    }
    
    private boolean needsDataAuthority(String statementId) {
        // 白名单：哪些 Mapper 方法需要数据权限
        // 配置方式：从 sys_data_authority_rule 表读取
        // 或者通过注解标记 @DataAuthority
        return true; // 简化处理，实际应读取配置
    }
}
```

### 5. AOP 切面实现（另一种方式）

```java
@Aspect
@Component
public class DataAuthorityAspect {
    
    @Around("@annotation(dataAuthority)")
    public Object around(ProceedingJoinPoint point, DataAuthority dataAuthority) throws Throwable {
        // 获取当前用户
        User user = SecurityContextHolder.getCurrentUser();
        
        // 构建数据权限条件
        String condition = DataAuthorityContext.buildCondition(user);
        
        // 存入 ThreadLocal，供后续 DAO 层使用
        DataAuthorityContext.setCondition(condition);
        
        try {
            return point.proceed();
        } finally {
            DataAuthorityContext.clear();
        }
    }
}

// DAO 层使用
@Mapper
public interface MeterDataMapper {
    
    @Select("SELECT * FROM biz_meter_data ${dataAuthorityCondition}")
    List<MeterData> selectList(@Param DataAuthorityCondition condition);
}
```

### 6. 数据权限配置表

```sql
CREATE TABLE sys_data_authority_config (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,                -- 角色ID
    table_name VARCHAR(50) NOT NULL,       -- 受控表名
    filter_column VARCHAR(50) DEFAULT 'org_id', -- 过滤字段
    rule_type VARCHAR(20) NOT NULL,        -- 规则类型
    custom_sql VARCHAR(500),               -- 自定义 SQL 条件
    description VARCHAR(200)
);
```

| rule_type | 说明 | 生成的 SQL 条件 |
|-----------|------|---------------|
| ALL | 全部数据 | 无过滤 |
| SELF_ORG | 本级及下级 | `org_id IN (SELECT id FROM sys_org WHERE path LIKE #{userPath}%)` |
| SELF_ONLY | 仅本级 | `org_id = #{userOrgId}` |
| SELF_CREATED | 自己创建的 | `create_by = #{userId}` |
| CUSTOM | 自定义 | `#{customSql}` |

### 7. 前端数据权限联动

前端需要根据用户角色动态控制：
- 查询条件中的组织选择器：默认选中用户所属组织，可选范围受用户层级限制
- 表格数据：自动应用后端过滤，无需前端处理
- 导出功能：导出数据同样受数据权限控制

```javascript
// 组织选择器组件
// 根据用户 orgLevel 决定可选层级
// 省级用户：可选省/地市/区县/班组
// 地市用户：可选地市/区县/班组
// 区县用户：可选区县/班组
```

## 参考
- MyBatis 拦截器文档
- Spring AOP 文档
- South Grid 数据权限规范
