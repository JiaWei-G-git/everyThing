# Vue3 组合式 API 通用组件设计笔记

日期: 2026-04-20
来源: Claude-Code Session
标签: [frontend, vue, component]

---

## 场景

项目中需要大量可复用的表单组件（输入框、下拉选择、日期选择器等），每次从零写很浪费时间。

## 遇到的问题

Options API 时代写组件，data/computed/methods 分散在不同区域，逻辑难以复用。
组合式 API 时代，可以用 composable 提取通用逻辑，但团队成员写法不统一，有的用 ref 有的用 reactive，有的用 toRefs 有的不用。

## 最终方案

用下面这个 Prompt 让 AI 生成标准组件：

```
请帮我设计一个 Vue3 的通用 {{组件类型}} 组件，要求：
1. 使用组合式 API（setup 语法糖）
2. 支持 v-model 双向绑定
3. 暴露以下配置项：
   - label: 标签文本
   - placeholder: 占位符
   - disabled: 是否禁用
   - validate: 校验规则函数（返回 true/false 或错误信息）
4. 使用 emit 抛出 change / blur / focus 事件
5. 样式使用 scoped + CSS 变量，支持主题切换
6. 提供单元测试模板（Vitest）

输出格式：
- 完整的 .vue 单文件组件
- 使用说明（props / events / slots 列表）
- 使用示例
```

这个 Prompt 生成了一个 InputWrapper 组件，所有表单控件都基于它扩展，开发效率提升很多。

## 踩坑记录

1. defineExpose 暴露方法给父组件调用时，ref 获取实例的写法要放在 await nextTick() 后面
2. CSS 变量在 scoped 样式中穿透子组件，需要用 :deep()，但 Vue3.3+ 已经自动处理了
3. 校验规则的异步支持：validate 函数返回 Promise 时，要用 async/await 处理，不能简单用 if (validate())

## 复用价值

这个 Prompt 模板可以套用到几乎所有表单组件上，只需要改 {{组件类型}} 和具体的内部实现。已经用于 5 个项目的表单系统。
