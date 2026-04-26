# SQL 慢查询分析与优化笔记

日期: 2026-04-15
来源: Cursor Session
标签: [backend, database, performance]

---

## 问题描述

生产环境订单查询接口响应时间超过 3 秒，监控显示数据库 CPU 使用率飙升到 90%。

## 分析过程

用下面这个 Prompt 让 AI 分析：

```
请分析以下 SQL 查询的性能瓶颈，并给出优化建议：

{{sql语句}}

要求：
1. 指出缺少的索引或索引使用不当的地方
2. 分析执行计划中的全表扫描和文件排序
3. 给出改写后的 SQL（如有必要）
4. 评估优化后的预期性能提升
5. 如果涉及 JOIN，分析驱动表选择是否合理

输出格式：
- 问题诊断（逐条列出）
- 优化方案（含具体 SQL）
- 验证建议（如何确认优化生效）
```

## 实际案例

原始查询（3.2s）：
```sql
SELECT o.*, u.name, u.phone 
FROM orders o 
LEFT JOIN users u ON o.user_id = u.id 
WHERE o.status = 'paid' 
  AND o.created_at > '2026-01-01'
ORDER BY o.amount DESC 
LIMIT 100;
```

问题分析：
1. orders.status 没有索引，导致全表扫描 200 万行
2. orders.created_at 虽然有索引，但和 status 一起用的时候没有复合索引
3. ORDER BY amount DESC 导致 filesort，内存排序压力很大
4. LEFT JOIN users 在 WHERE 中没有用到 u 的字段，但实际执行了 JOIN

优化后（120ms）：
```sql
-- 添加复合索引
CREATE INDEX idx_status_created_at_amount 
ON orders(status, created_at, amount);

-- 改写查询：先过滤再 JOIN
SELECT o.*, u.name, u.phone 
FROM (
  SELECT * FROM orders 
  WHERE status = 'paid' 
    AND created_at > '2026-01-01'
  ORDER BY amount DESC 
  LIMIT 100
) o 
INNER JOIN users u ON o.user_id = u.id;
```

## 优化效果

- 查询时间：3.2s -> 120ms（提升 26 倍）
- 数据库 CPU：90% -> 25%
- 索引添加时间：约 30 秒（online DDL）

## 可复用的 Prompt 模板

上面的分析 Prompt 已经提炼为标准模板，适用于几乎所有 SQL 性能分析场景。只需替换 {{sql语句}} 即可。

## 关联笔记
- [[Docker-多阶段构建踩坑记录]]
