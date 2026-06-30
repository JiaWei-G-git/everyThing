# RBAC 后端实现模式

## 概述
Role-Based Access Control（基于角色的访问控制）后端实现方案。适用于 Spring Boot / FastAPI / Express / Go Gin 等主流框架。

## 数据库表设计

### 标准 RBAC 五表模型

```sql
-- 用户表
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,          -- 加密存储
    real_name VARCHAR(50),
    org_id BIGINT,                           -- 组织ID（数据权限）
    status TINYINT DEFAULT 1,               -- 0=禁用, 1=启用
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE sys_role (
    id BIGINT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE,   -- 角色编码
    role_name VARCHAR(50) NOT NULL,          -- 角色名称
    description VARCHAR(200),
    status TINYINT DEFAULT 1
);

-- 权限表（菜单/按钮权限）
CREATE TABLE sys_permission (
    id BIGINT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,  -- 权限编码
    permission_name VARCHAR(100) NOT NULL,
    type VARCHAR(20),                        -- MENU / BUTTON / API
    parent_id BIGINT,                        -- 父权限ID（树形）
    path VARCHAR(200),                       -- 页面路径或API路径
    sort_order INT DEFAULT 0
);

-- 用户角色关联表
CREATE TABLE sys_user_role (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

-- 角色权限关联表
CREATE TABLE sys_role_permission (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);
```

## 权限编码规范

| 类型 | 编码格式 | 示例 |
|------|---------|------|
| 页面菜单 | `module:page` | `system:user`, `meter:collection` |
| 按钮操作 | `module:page:action` | `system:user:create`, `system:user:delete` |
| API 接口 | `api:module:action` | `api:user:query`, `api:user:update` |

## Spring Boot 实现框架

### 1. JWT 认证过滤器

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain chain) throws IOException, ServletException {
        String token = extractToken(request);
        if (token != null && jwtUtil.validateToken(token)) {
            Long userId = jwtUtil.getUserId(token);
            UserDetails userDetails = userDetailsService.loadUserById(userId);
            UsernamePasswordAuthenticationToken auth = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }
}
```

### 2. 权限注解

```java
// 控制器方法上使用
@PreAuthorize("hasPermission('system:user:create')")
public Result createUser(@RequestBody UserDTO dto) { ... }

@PreAuthorize("hasPermission('system:user:delete')")
public Result deleteUser(@PathVariable Long id) { ... }
```

### 3. 权限加载

```java
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Override
    public UserDetails loadUserById(Long userId) {
        User user = userMapper.selectById(userId);
        List<Role> roles = roleMapper.selectByUserId(userId);
        List<Permission> permissions = permissionMapper.selectByRoleIds(roles);
        
        List<SimpleGrantedAuthority> authorities = permissions.stream()
            .map(p -> new SimpleGrantedAuthority(p.getPermissionCode()))
            .collect(Collectors.toList());
        
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(), user.getPassword(), authorities
        );
    }
}
```

## 数据权限扩展

### 组织层级表

```sql
CREATE TABLE sys_org (
    id BIGINT PRIMARY KEY,
    org_code VARCHAR(50) NOT NULL,          -- 组织编码
    org_name VARCHAR(100) NOT NULL,        -- 组织名称
    org_type VARCHAR(20),                    -- province/city/district/team/station
    parent_id BIGINT,                       -- 父组织ID
    level INT NOT NULL,                     -- 层级 1=省 2=地市 3=区县 4=班组 5=供电所
    path VARCHAR(500)                       -- 层级路径，如 1.2.3.4
);
```

### 数据权限拦截器（MyBatis）

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
@Component
public class DataAuthorityInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];
        
        // 获取当前用户
        Long currentUserId = SecurityContextHolder.getUserId();
        User user = userMapper.selectById(currentUserId);
        
        // 如果用户是超级管理员，不拦截
        if (user.isAdmin()) {
            return invocation.proceed();
        }
        
        // 获取用户组织层级
        Org userOrg = orgMapper.selectById(user.getOrgId());
        
        // 动态修改 SQL，添加 org_id 过滤条件
        // 实现方式：使用 MyBatis 的 BoundSql 修改 SQL 文本
        // 添加 WHERE org_id IN (SELECT id FROM sys_org WHERE path LIKE userOrg.path + '%')
        
        return invocation.proceed();
    }
}
```

### 数据权限规则配置

```sql
CREATE TABLE sys_data_authority_rule (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    table_name VARCHAR(50) NOT NULL,        -- 受控表名
    column_name VARCHAR(50),                -- 过滤字段（默认 org_id）
    rule_type VARCHAR(20),                  -- SELF/CHILDREN/ALL
    description VARCHAR(200)
);
```

| rule_type | 说明 | SQL 条件 |
|-----------|------|---------|
| SELF | 只能看自己的数据 | `WHERE create_by = #{userId}` |
| CHILDREN | 看本级及下级数据 | `WHERE org_id IN (SELECT id FROM sys_org WHERE path LIKE #{userPath} + '%')` |
| ALL | 看全部数据 | 无过滤条件 |
| SIBLINGS | 看同级数据 | `WHERE org_level = #{userOrgLevel} AND org_parent = #{userOrgParent}` |

## 参考
- Spring Security 官方文档
- Apache Shiro 权限框架
