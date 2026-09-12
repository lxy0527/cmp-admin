/**
 * mock 假数据统一出口
 * ============================================================
 * 真实接口就绪后的切换方式（**不用改任何业务代码**）：
 *   1. 把 `.env.*` 里的 `VITE_USE_MOCK` 改成 `false`；
 *   2. api 层里 `if (USE_MOCK) return mockXxx()` 那一支会自动跳过，改走 axios 真实请求。
 *
 * 按模块拆文件，对接时可以一个模块一个模块地切：
 *   helper.ts      —— 公共（延迟模拟、统一返回结构、总开关）
 *   auth.ts        —— 登录 / 用户信息
 *   menu.ts        —— 后端下发的菜单树（用于验证"动态菜单"这条链路）
 *   permitWork.ts  —— 许可作业列表
 *   role.ts        —— 角色管理
 *   dashboard.ts   —— 首页看板
 */
export * from './helper'
export * from './auth'
export * from './menu'
export * from './permitWork'
export * from './role'
export * from './dashboard'
