---
title: Spring 循环依赖：三级缓存到底解决了什么
subtitle: Circular Dependencies and the Three-Level Cache
date: 2023-07-16
year: 2023
area: spring
tags: [spring]
featured: true
summary: 三级缓存不是为了“提前暴露对象”这么简单，它解决的是 AOP 场景下代理对象什么时候创建的问题。搞懂这一点，才能解释构造器注入为什么救不了循环依赖。
---

第一次看到这个报错的时候，我以为是自己把顺序写错了：

```
BeanCurrentlyInCreationException:
Error creating bean with name 'orderService':
Requested bean is currently in creation: Is there an unresolvable circular reference?
```

奇怪的是，另一个模块里同样存在 A 依赖 B、B 又依赖 A 的情况，却启动得好好的。

差别在于注入方式。

## 为什么字段注入能解决，构造器注入不行

Spring 创建单例 bean 的过程大致是：实例化 → 属性填充 → 初始化。

关键在于**实例化之后，对象已经在内存里了**，只是属性还没填。如果是字段注入或 setter 注入，Spring 可以把这个“半成品”提前暴露出去，让 B 先拿到它的引用，等 A 的属性填完再继续。

构造器注入没有这个空间：要构造 A 就必须先有 B，要构造 B 又必须先有 A，鸡生蛋的问题在“实例化”这一步就卡死了，根本没有可以提前暴露的东西。

所以：

| 注入方式 | 循环依赖 | 原因 |
| --- | --- | --- |
| 构造器注入 | 启动失败 | 实例化阶段就需要对方，没有半成品可用 |
| 字段 / setter 注入 | 可以解决 | 实例已创建，可以先给引用再填属性 |

**这也是为什么官方推荐构造器注入**：它把问题暴露在启动时，而不是让你带着一个设计上的环继续跑下去。

## 三个缓存分别装什么

`DefaultSingletonBeanRegistry` 里确实有三个 Map，但它们的职责不是“缓存三级”这么简单：

```java
/** 一级：完全初始化好的成品 */
private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);

/** 二级：早期的、还没填完属性的半成品（可能是代理） */
private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);

/** 三级：能生产早期引用的工厂 */
private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);
```

取 bean 的逻辑在 `getSingleton(String beanName, boolean allowEarlyReference)` 里，顺序是：一级 → 二级 → 三级。命中三级缓存时会调用工厂拿到早期引用，然后**放进二级缓存，同时清掉三级**。

## 为什么必须有第三级

这是面试最爱问、也最容易讲错的地方。答案不是“为了加速”，而是 **AOP**。

我们改一下场景：A 上面加了 `@Transactional`，那么最终放进容器的 A 是一个代理对象。现在 B 需要注入 A：

- 如果 A 和 B **没有**循环依赖，A 会正常走完初始化，在 `initializeBean` 阶段被代理，放进一级缓存的是代理。
- 如果 A 和 B **有**循环依赖，B 在 A 还没初始化完的时候就要拿到 A。这时候给它原始对象还是代理对象？

给原始对象，B 后续调用 A 的事务方法就不会走切面——**这是非常隐蔽的 bug，编译通过、启动正常、事务悄悄失效。**

三级缓存放的是一个 `ObjectFactory`，它的实现里调用了 `getEarlyBeanReference`，而后者会通知那些 `SmartInstantiationAwareBeanPostProcessor`（AOP 的自动代理创建器就是其中之一）：

```java
protected Object getEarlyBeanReference(String beanName, RootBeanDefinition mbd, Object bean) {
    Object exposedObject = bean;
    for (BeanPostProcessor bp : getBeanPostProcessors()) {
        if (bp instanceof SmartInstantiationAwareBeanPostProcessor ibp) {
            exposedObject = ibp.getEarlyBeanReference(exposedObject, beanName);
        }
    }
    return exposedObject;
}
```

关键在于这个动作是**延迟**的：只有真的发生循环依赖、真的需要提前引用时，才会去生成代理。没有循环依赖的场景一次都不会调用，代理仍然在正常的生命周期节点创建。

如果只用二级缓存直接存原始对象，就必须在实例化之后立刻判断“要不要提前代理”——为一个很少发生的情况付出每次创建都要检查的成本，而且会破坏 AOP 的时机约定。

## 于是有了一个反直觉的细节

提前生成的代理会被记在 `earlyProxyReferences` 里。等 A 走完初始化进入 `wrapIfNecessary` 时，AOP 会发现“这个 bean 我已经提前代理过了”，于是直接返回原来那个早期引用，不再生成第二个代理。

如果没有这个记录，A 就会有两个代理实例：B 持有早期那个，容器持有后来那个。事务能用，但对象身份不一致——这正是 `@Async`、`@Transactional` 在循环依赖场景里行为诡异的部分来源。

## 我能从这件事里学到什么

三级缓存是个漂亮的设计：它把“要不要提前代理”这个判断延后到了必须做决定的时刻。但它解决的问题，本质上是一个本该避免的问题。

我现在对循环依赖的处理方式是：

1. **先看是不是设计问题**。绝大多数 A↔B 互相依赖，都说明有一个职责被切错了地方。
2. **能拆就拆**。把共享的部分抽成第三个 bean，环就消失了。
3. **实在拆不动，再考虑 `@Lazy`**。它会注入一个代理，把依赖推迟到第一次调用，成本是问题被推迟到运行期。

Spring 能兜住的事，不代表它应该兜住。
