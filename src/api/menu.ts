/**
 * 菜单接口（当前为占位，接口就绪后在这里对接）
 * ============================================================
 * 设计意图：把"菜单从哪来"收敛到一个函数里。
 *   - `VITE_MENU_SOURCE=static`：直接返回 null，store 用静态配置
 *   - `VITE_MENU_SOURCE=remote|auto`：走下面这个接口
 *
 * 接口要求（跟前端约定，可直接给后端）：
 *   GET /menu/routes
 *   → 返回当前登录用户的菜单树（后端已按角色过滤），节点字段见 config/menuTree.ts 的 RemoteMenuNode。
 *   最少需要：name（显示名）、path（完整路由路径）、children（可空）、permission（可空）。
 *
 * ⚠️ 待确认：
 *   - 菜单里是否要带前端组件路径（component）？建议**不带**：页面组件必须在前端注册，
 *     后端返回组件字符串会有"前端没实现却点了菜单"的风险。约定由前端按 path 匹配路由。
 *   - 后端过滤还是前端过滤？建议"后端过滤 + 前端再过滤一遍"（双保险，前端过滤已在 store 里）。
 */
import { request } from './request'
import { USE_MOCK, mockFetchRemoteMenus } from '@/mock'
import type { RemoteMenuNode } from '@/config/menuTree'

/** 菜单来源：static（前端静态配置）| remote（后端下发）| auto（先接口后回退） */
export const MENU_SOURCE = (import.meta.env.VITE_MENU_SOURCE || 'static') as
  | 'static'
  | 'remote'
  | 'auto'

/** 拉取后端菜单树；static 模式下直接返回 null */
export async function fetchRemoteMenus(): Promise<RemoteMenuNode[] | null> {
  if (MENU_SOURCE === 'static') return null
  if (USE_MOCK) return mockFetchRemoteMenus()
  const { data } = await request<RemoteMenuNode[]>({ url: '/menu/routes', method: 'get' })
  return (data as RemoteMenuNode[]) || null
}
