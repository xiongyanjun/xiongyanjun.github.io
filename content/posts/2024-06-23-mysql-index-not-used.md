---
title: MySQL 索引失效：十个真实出现过的写法
subtitle: Ten Ways to Lose Your Index
date: 2024-06-23
year: 2024
area: data
tags: [mysql, performance]
featured: true
summary: 索引失效的说法不准确，更准确的描述是“优化器认为走索引不划算”。这十个写法都来自真实代码，每个都附了执行计划的变化和改法。
---

线上有个列表接口，数据量到两百万行以后开始变慢，从 30ms 涨到 2 秒。表上有索引，`EXPLAIN` 显示 `type=ALL`。

把那次排查里出现过的问题汇总了一下，一共十种。它们共同的特点是：**代码看起来完全正常，没有任何语法错误，只是优化器选择了全表扫描。**

## 一、在列上做运算或调用函数

```sql
-- 走不了索引：索引是按 create_time 的值排序的，不是按 DATE(create_time)
SELECT * FROM orders WHERE DATE(create_time) = '2024-06-01';

-- 改成范围查询
SELECT * FROM orders
WHERE create_time >= '2024-06-01 00:00:00'
  AND create_time <  '2024-06-02 00:00:00';
```

同理的还有 `WHERE id + 1 = 100`、`WHERE UPPER(name) = 'ABC'`。原则很简单：**等号左边只能是一个裸列。**

## 二、隐式类型转换

这是最隐蔽的一种。字段是 `varchar(32)`，代码传进来一个数字：

```sql
-- phone 是 varchar，传入数字会导致全部行被转换后比较
SELECT * FROM users WHERE phone = 13800000000;
```

`EXPLAIN` 里 `key` 为 `NULL`，`rows` 是整表行数。改法是把参数转成字符串传入，或者在 Java 侧就不要用 `Long` 接这个字段。

反过来（字段是 `bigint`，传字符串）通常不会失效，因为 MySQL 把字符串转成数字，代价可以接受。**所以只有“字符列被拿来和数字比”这一种方向需要警惕。**

## 三、前导模糊匹配

```sql
SELECT * FROM users WHERE name LIKE '%张%';   -- 全表扫描
SELECT * FROM users WHERE name LIKE '张%';     -- 可以走索引
```

如果确实需要中间匹配，考虑全文索引或引入 ES。**在 MySQL 上用 `%xxx%` 做模糊搜索，本质上是在替代检索引擎。**

## 四、`OR` 两边有一个没索引

```sql
SELECT * FROM users WHERE phone = '138...' OR remark LIKE '%vip%';
```

即使 `phone` 有索引，只要 `OR` 的另一侧无法走索引，整体就会退化为全表扫描。这种情况通常应该拆成两条查询再合并，或者给另一侧也建立可用的索引。

## 五、联合索引跳过了最左列

索引是 `(a, b, c)`，查询条件只有 b 和 c：走不了。

更需要注意的是“部分生效”：条件里同时有 a 和 c，索引只能用到 a。**`EXPLAIN` 的 `key_len` 能看出到底用了几列**，这个字段比 `key` 更有信息量。

## 六、范围条件之后的列用不上

索引 `(status, create_time, user_id)`，查询：

```sql
SELECT * FROM orders
WHERE status = 1
  AND create_time > '2024-01-01'
  AND user_id = 10086;
```

`create_time` 用了范围查询之后，后面的 `user_id` 无法再用于索引定位，只能在已定位的范围内过滤。这不是 bug，是 B+ 树的结构决定的——**范围查询之后的列只能做过滤，不能做定位。**

所以联合索引里，等值条件列应该排在范围条件列前面。

## 七、`!=`、`NOT IN`、`IS NOT NULL`

这三类条件都很难用索引，因为 B+ 树擅长定位“一个区间”，不擅长表达“除了这些之外的全部”。如果这类条件筛掉的数据很少（比如状态只有两种，`status != 1` 占了 90%），优化器会直接选全表扫描。

## 八、`ORDER BY` 与索引顺序不一致

```sql
-- 索引是 (status, create_time)
SELECT * FROM orders WHERE status = 1 ORDER BY create_time;   -- 可以用索引有序性，无需排序
SELECT * FROM orders WHERE status = 1 ORDER BY id;            -- 需要 filesort
```

`EXPLAIN` 的 `Extra` 里出现 `Using filesort` 就说明排序没能利用索引。数据量小时无所谓，数据量大时 `filesort` 会吃满临时空间。

## 九、区分度太低的列单独建索引

给 `status`、`is_deleted` 这种只有两三个值的列单独建索引，优化器通常用不上——**走索引之后再回表，比直接全表扫描更慢**。这类列只有在作为联合索引的前缀时才有意义。

判断方法很简单：

```sql
SELECT COUNT(DISTINCT status) / COUNT(*) FROM orders;   -- 低于 0.01 基本没有单独建索引的价值
```

## 十、统计信息过期

这一种跟前九种不同——SQL 写法完全正确，但优化器给出的估算严重偏差。表现是同一个 SQL 在测试环境走索引、在生产环境全表扫描。

```sql
ANALYZE TABLE orders;                     -- 手动更新统计信息
SHOW INDEX FROM orders;                   -- 看 Cardinality 是否明显失真
```

如果一张表有大比例的数据变更（比如批量导入），在导入之后主动 `ANALYZE` 是值得的习惯。

## 怎么快速判断属于哪一种

我现在固定按这个顺序看：

1. `EXPLAIN` 看 `type`：出现 `ALL` 就是全表扫描，`index` 是走完整索引树（也常常不够好，目标是 `range` 或 `ref`）；
2. 看 `key` 和 `possible_keys`：`possible_keys` 有值而 `key` 为空，通常就是前九种里的某一种；
3. 看 `rows`：估算行数接近总行数，说明优化器认为走索引不划算；
4. 看 `key_len`：判断联合索引用到了几列；
5. 看 `Extra`：`Using filesort`、`Using temporary`、`Using index condition` 各自指向不同的问题。

顺便说一句，MySQL 8.0 的 `EXPLAIN ANALYZE` 会实际执行并给出真实耗时，排查时比普通 `EXPLAIN` 有用得多。

## 最后

这十种情况里，真正“没办法”的只有少数几种。绝大多数失效都可以通过调整 SQL 写法或索引顺序解决。

我现在的做法是：**索引设计完成后，把每个查询场景的 `EXPLAIN` 结果跑一遍，作为上线检查项之一。** 因为这类问题不会在上线当天暴露，可能几个月后才以“这个接口最近有点慢”的形式出现，那时候排查成本会高得多。
