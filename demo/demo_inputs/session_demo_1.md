---
project: "电商后台"
date: "2026-04-25"
topic: "接口性能优化"
source: "Kimi-Code-Session"
tags: [backend, optimization]
status: active
---

# 会话记录 - 接口性能优化

## 背景
用户反馈商品列表接口响应时间超过 3 秒，需要排查优化。

## Prompt
```
请帮我分析这个 SQL 查询为什么慢，并给出优化方案：
SELECT * FROM products p 
JOIN categories c ON p.category_id = c.id 
WHERE p.status = 'active' 
ORDER BY p.created_at DESC;
```

## 解决思路
AI 建议：
1. 添加复合索引 (status, created_at)
2. 避免 SELECT *，只取需要的字段
3. 使用 EXPLAIN 分析执行计划

## 优化经验
以后遇到慢查询，先让 AI 分析执行计划再动手改索引。不要凭直觉加索引。
