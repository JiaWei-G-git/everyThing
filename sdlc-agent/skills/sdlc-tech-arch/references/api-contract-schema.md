# API 契约 YAML 结构规范

## 文件位置
`artifacts/api-contract.yaml`

## 结构定义

```yaml
api_contract:
  version: "v1"                          # 契约版本号
  base_path: "/api/v1"                   # API 基础路径
  
  standards:                             # 全局规范
    response:                            # 标准响应格式
      code: int                          # 业务状态码（非 HTTP 状态码）
      message: string                    # 提示消息
      data: object                       # 业务数据
      timestamp: long                    # 服务器时间戳
    
    pagination:                          # 分页标准格式
      page: int                          # 当前页码（从 1 开始）
      size: int                          # 每页条数
      total: int                         # 总条数
      data: []                           # 数据列表
      totalPages: int                    # 总页数
  
  endpoints:                             # 端点列表
    - id: "API-001"                      # 端点唯一标识
      path: "/users"                     # 请求路径（相对 base_path）
      method: "GET"                      # HTTP 方法：GET/POST/PUT/DELETE/PATCH
      tags: ["USER"]                     # 标签（用于分组）
      summary: "查询用户列表"             # 接口描述
      
      request:                           # 请求定义
        query:                           # Query 参数（GET 请求）
          page: { type: int, required: false, default: 1, description: "页码" }
          size: { type: int, required: false, default: 10, description: "每页条数" }
          keyword: { type: string, required: false, description: "关键词" }
          org_id: { type: long, required: false, description: "组织ID（数据权限过滤）" }
        body:                            # Body 参数（POST/PUT 请求）
          id: { type: long, required: true, description: "用户ID" }
          username: { type: string, required: true, description: "用户名" }
          role_ids: { type: "array<long>", required: true, description: "角色ID列表" }
          org_id: { type: long, required: true, description: "组织ID" }
          phone: { type: string, required: false, description: "手机号" }
        path:                            # Path 参数
          id: { type: long, required: true, description: "用户ID" }
      
      response:                          # 响应定义
        data:                            # 业务数据（嵌套在标准 response 内）
          items: { type: "array<object>", description: "数据列表" }
          total: { type: int, description: "总条数" }
      
      related_req: ["REQ-USER-001"]        # 关联需求 ID
      related_page: ["用户列表"]          # 关联页面
      related_table: ["sys_user"]        # 关联数据库表
      
    - id: "API-002"
      path: "/users/{id}"
      method: "PUT"
      tags: ["USER"]
      summary: "更新用户信息"
      request:
        path:
          id: { type: long, required: true, description: "用户ID" }
        body:
          username: { type: string, required: true }
          role_ids: { type: "array<long>", required: true }
          org_id: { type: long, required: true }
          phone: { type: string, required: false }
      response:
        data:
          success: { type: boolean, description: "是否成功" }
      related_req: ["REQ-USER-002"]
      related_page: ["用户编辑"]
      related_table: ["sys_user", "sys_user_role"]
```

## 字段类型定义

| 类型 | 说明 | 示例 |
|------|------|------|
| string | 字符串 | `"张三"` |
| int | 整数 | `42` |
| long | 长整数 | `123456789012` |
| boolean | 布尔值 | `true` / `false` |
| float / double | 浮点数 | `3.14` |
| date | 日期 | `"2025-06-29"` |
| datetime | 日期时间 | `"2025-06-29T10:00:00Z"` |
| array<T> | 数组 | `[1, 2, 3]` |
| object | 对象/Map | `{"key": "value"}` |
| file | 文件 | 上传文件 |

## 约束规则

1. **每个 endpoint 必须有唯一 ID**：`API-{SEQ}`，全项目递增
2. **必须关联下游产物**：每个 endpoint 必须填写 `related_req`, `related_page`, `related_table`
3. **路径规范**：RESTful 风格，`/resources` 列表，`/resources/{id}` 单条操作
4. **分页标准**：所有列表接口统一使用 `page` + `size` 参数，返回标准 pagination 格式
5. **数据权限**：列表接口必须包含 `org_id` 参数（用于数据权限过滤）
6. **响应标准**：所有接口返回统一包装格式（code + message + data + timestamp）
7. **只读契约**：下游阶段（前端、后端、测试）只读取此文件，不修改
8. **变更流程**：如需修改 API，必须回到技术架构阶段更新契约，再同步到下游

## 变更管理

当 API 需要变更时：
1. 在技术架构阶段修改 `api-contract.yaml`
2. 使用 RTM 追踪影响：找出所有引用此 API 的页面、代码、测试用例
3. 重新生成受影响的下游产物（前端、后端、测试）
4. 记录变更历史在契约文件头部注释
