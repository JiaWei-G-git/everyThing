# CWE 分类参考表

> D.A.R.E.代码阶段安全审查使用的CWE分类速查表。
> 覆盖常见Web应用、API服务、移动端的安全漏洞模式。

## 按严重程度分级

### Critical (立即修复)

| CWE编号 | 名称 | 描述 | 常见场景 | 检测模式 |
|---------|------|------|----------|----------|
| CWE-89 | SQL注入 | 用户输入拼接SQL语句 | 原生SQL查询、动态Query | 字符串拼接 + SQL关键词 |
| CWE-78 | OS命令注入 | 用户输入执行系统命令 | exec()/system()/popen() | 用户输入 → 命令执行函数 |
| CWE-94 | 代码注入 | 用户输入被当作代码执行 | eval()、动态代码执行 | eval/exec + 用户输入 |
| CWE-22 | 路径遍历 | 未限制文件访问路径 | 文件下载、读取 | 用户输入 → 文件路径拼接 |
| CWE-798 | 硬编码凭证 | 密码/密钥写死在代码中 | 配置文件、常量定义 | password/secret/key 硬编码 |
| CWE-502 | 反序列化漏洞 | 不信任数据反序列化 | pickle、Java反序列化 | unserialize/unpickle + 用户输入 |

### High (24小时内修复)

| CWE编号 | 名称 | 描述 | 常见场景 | 检测模式 |
|---------|------|------|----------|----------|
| CWE-200 | 信息泄露 | 暴露敏感信息给未授权用户 | 错误堆栈、调试信息返回 | 异常信息返回客户端 |
| CWE-259 | 硬编码密码 | 密码以明文形式存在于源码 | 数据库连接字符串 | 连接字符串含密码 |
| CWE-287 | 认证不当 | 身份验证机制被绕过 | 缺少认证中间件 | 敏感接口无认证 |
| CWE-306 | 缺失关键功能认证 | 重要操作无需认证 | 管理接口暴露 | 管理功能无权限检查 |
| CWE-352 | CSRF | 跨站请求伪造 | 状态变更操作无Token | POST/DELETE无CSRF防护 |
| CWE-434 | 危险类型文件上传 | 未限制上传文件类型 | 文件上传功能 | 上传接口无类型/后缀检查 |
| CWE-611 | XXE | XML外部实体攻击 | XML解析 | 未禁用外部实体的XML解析 |
| CWE-918 | SSRF | 服务器端请求伪造 | 内网请求代理、webhook | 用户输入URL → 服务器请求 |
| CWE-319 | 明文传输 | 敏感数据未加密传输 | HTTP传输密码、API Key | 敏感数据走HTTP |
| CWE-798 | 使用硬编码加密密钥 | 密钥管理不当 | AES/DES密钥硬编码 | 加密密钥在代码中 |

### Medium (当前Sprint修复)

| CWE编号 | 名称 | 描述 | 常见场景 | 检测模式 |
|---------|------|------|----------|----------|
| CWE-20 | 输入验证不当 | 未验证用户输入格式 | 所有用户输入点 | 缺少输入验证逻辑 |
| CWE-79 | XSS | 跨站脚本攻击 | 用户输入渲染到页面 | 用户输入 → HTML输出 |
| CWE-119 | 缓冲区溢出 | 越界内存访问 | C/C++字符串操作 | strcpy/sprintf无长度检查 |
| CWE-190 | 整数溢出 | 数值运算溢出 | 数值计算、类型转换 | 大数运算无溢出检查 |
| CWE-276 | 错误权限默认设置 | 默认权限过于宽松 | 文件创建、目录权限 | 777权限、Everyone访问 |
| CWE-311 | 敏感数据加密缺失 | 敏感数据未加密存储 | 密码、身份证存储 | 明文存储敏感字段 |
| CWE-327 | 破损/危险加密算法 | 使用已知弱加密算法 | MD5、DES、RC4 | 使用弱哈希/加密 |
| CWE-330 | 随机数不充分 | 使用可预测的随机数 | Token生成、验证码 | Math.random()用于安全场景 |
| CWE-601 | 重定向/跳转 | 开放重定向漏洞 | URL跳转、登录回跳 | 用户输入 → Location头 |
| CWE-732 | 关键资源权限分配错误 | 权限检查不完整 | 功能级权限控制 | 部分接口无权限校验 |

### Low (下次迭代修复)

| CWE编号 | 名称 | 描述 | 常见场景 | 检测模式 |
|---------|------|------|----------|----------|
| CWE-209 | 错误消息信息泄露 | 错误信息暴露内部细节 | 调试日志、错误响应 | 详细错误返回客户端 |
| CWE-548 | 目录遍历信息泄露 | 目录列表暴露 | 静态资源服务 | 目录索引开启 |
| CWE-598 | 敏感信息GET请求 | 使用GET传输敏感数据 | URL传密码/Token | 敏感参数在URL中 |
| CWE-642 | 关键状态数据外部控制 | 依赖客户端可控状态 | 隐藏字段控制权限 | type=hidden控制权限 |
| CWE-770 | 资源分配无限制 | 无限制的资源分配 | 文件上传大小、数组长度 | 无大小限制的上传/请求 |
| CWE-776 | XPath注入 | XPath查询拼接用户输入 | XML数据查询 | 用户输入 → XPath |
| CWE-916 | 哈希函数过度迭代 | 不恰当的哈希迭代次数 | 密码哈希 | 自定义哈希次数不当 |

## 按攻击向量分类

### 注入类
- **CWE-89** SQL注入
- **CWE-78** 命令注入
- **CWE-94** 代码注入
- **CWE-611** XXE注入
- **CWE-918** SSRF
- **CWE-776** XPath注入

### 认证与授权类
- **CWE-287** 认证不当
- **CWE-306** 缺失关键功能认证
- **CWE-352** CSRF
- **CWE-732** 关键资源权限分配错误

### 数据泄露类
- **CWE-200** 信息泄露
- **CWE-209** 错误消息信息泄露
- **CWE-548** 目录遍历信息泄露
- **CWE-598** 敏感信息GET请求
- **CWE-311** 敏感数据加密缺失

### 加密与随机数类
- **CWE-319** 明文传输
- **CWE-327** 危险加密算法
- **CWE-330** 随机数不充分
- **CWE-798** 硬编码凭证/密钥

### 输入验证类
- **CWE-20** 输入验证不当
- **CWE-22** 路径遍历
- **CWE-434** 危险文件上传
- **CWE-601** 开放重定向
- **CWE-642** 关键状态外部控制

## 自动化检测关键词

```yaml
# CI/CD自动扫描时可用的正则/关键词模式
detection_patterns:
  sql_injection:
    keywords: ["execute(", "raw(", "query(", "SELECT.*\+", "INSERT.*\+", "UPDATE.*\+"]
    severity: Critical

  command_injection:
    keywords: ["os.system", "subprocess.call", "exec(", "eval(", "Runtime.getRuntime"]
    severity: Critical

  hardcoded_secret:
    patterns: ["password\s*=\s*['\"][^'\"]+['\"]", "secret\s*=\s*['\"][^'\"]+['\"]", "api_key\s*=\s*['\"][^'\"]+['\"]"]
    severity: Critical

  xss:
    keywords: ["innerHTML", "document.write", "{{.*|safe}}", "v-html", "dangerouslySetInnerHTML"]
    severity: Medium

  weak_crypto:
    keywords: ["md5", "sha1", "DES", "RC4", "Math.random"]
    severity: Medium

  info_leak:
    keywords: ["stacktrace", "Exception:", "debug=True", "traceback"]
    severity: Medium

  ssrf:
    keywords: ["requests.get", "urllib.request", "curl", "file_get_contents"]
    context: "用户输入作为URL"
    severity: High

  path_traversal:
    patterns: ["\\.\\./", "\\.\\.\\\\", "open\(.*\+"]
    severity: Critical
```

## 参考链接
- CWE完整列表: https://cwe.mitre.org/data/index.html
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE/SANS Top 25: https://cwe.mitre.org/top25/
