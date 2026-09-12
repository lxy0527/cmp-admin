/**
 * 菜单源适配层
 * ============================================================
 * 两个职责：
 *   1. `buildStaticMenus()` —— 把前端静态配置 `config/menu.ts` 归一化成 MenuNode 树
 *   2. `normalizeRemoteMenus()` —— 把**后端下发的菜单树**归一化成同一形状
 *
 * 归一化之后，渲染层（layout/MenuTree.vue）和权限过滤（store/menu.ts）
 * 完全不关心菜单是从哪来的，这就是"换源不改渲染"的关键。
 */
import { MODULES, type MenuItem, type ModuleConfig } from './menu'
import type { MenuNode } from './menuTypes'

/** 把模块内的 path 片段拼成完整路由路径 */
function toRoutePath(modulePath: string, itemPath: string): string {
  if (itemPath.startsWith('/')) return itemPath
  return `${modulePath}/${itemPath}`
}

/** 静态 MenuItem -> MenuNode（递归） */
function itemToNode(module: ModuleConfig, item: MenuItem, parentPath: string): MenuNode {
  const routePath = toRoutePath(parentPath, item.path)
  const children = item.children?.map((child) => itemToNode(module, child, routePath))

  return {
    // key 用完整路径，保证全局唯一，且能直接当展开状态/选中判断的键
    key: routePath,
    title: item.title,
    // 分组节点自身不跳转（有 children 就不给 routePath）
    routePath: children?.length ? undefined : routePath,
    sourcePath: item.path,
    permission: item.permission,
    icon: item.icon,
    order: item.order,
    hidden: item.hidden,
    externalLink: item.externalLink,
    disabled: item.disabled,
    badge: item.badge,
    children
  }
}

/** 静态配置 -> MenuNode 树 */
export function buildStaticMenus(modules: ModuleConfig[] = MODULES): MenuNode[] {
  return modules
    .filter((m) => !m.hidden)
    .map((module) => {
      const children = module.children.map((item) => itemToNode(module, item, module.path))
      return {
        key: module.path,
        title: module.title,
        // 模块节点 = 顶部 Tab，点 Tab 会跳到第一个可见子项，所以 routePath 留空
        sourcePath: module.path,
        icon: module.icon,
        order: module.order,
        children
      } satisfies MenuNode
    })
}

/* ============================================================
 * 下面是"后端下发菜单"的适配位（当前未启用，接口就绪后打开即可）
 * ============================================================ */

/**
 * 后端菜单节点形状（**假设**，等后端文档确认后只改这个类型 + normalizeRemoteMenus）
 * 典型差异点都已覆盖：字段名不同、path 可能是全路径、children 可能是空数组。
 */
export interface RemoteMenuNode {
  id?: number | string
  /** 显示名（有些后端叫 name / menuName / label） */
  name?: string
  menuName?: string
  label?: string
  /** 路由路径，后端一般直接给全路径 */
  path?: string
  url?: string
  /** 权限标识（有些后端叫 perms / permissionCode） */
  permission?: string
  perms?: string
  icon?: string
  orderNum?: number
  sort?: number
  visible?: boolean | number | string
  hidden?: boolean
  badge?: string | number
  children?: RemoteMenuNode[]
}

function pickString(...values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

function pickNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return undefined
}

/** 后端 visible 字段各种写法统一成 boolean */
function isVisible(node: RemoteMenuNode): boolean {
  if (node.hidden === true) return false
  const raw = node.visible
  if (raw === undefined || raw === null) return true
  return !(raw === false || raw === 0 || raw === '0' || raw === 'false')
}

/**
 * 菜单节点 key 的生成规则（**必须两个来源一致**）
 * ------------------------------------------------------------
 * 为什么优先用 path 当 key：
 *   布局要按"当前路由 path 前缀"判断当前处在哪个模块（顶部大 Tab 高亮 + 左侧菜单取哪个模块的子级）。
 *   如果静态模式 key = 路径、动态模式 key = 后端 id，就会出现"动态菜单下左侧永远是空的"这种坑（踩过）。
 *   所以统一：能用 path 就用 path；没 path 的才回退到后端 id。
 */
function buildKey(node: RemoteMenuNode, path?: string): string {
  const id = node.id === undefined || node.id === null ? '' : String(node.id)
  return path || id || `menu-${Math.random().toString(36).slice(2)}`
}

/** 后端菜单树 -> MenuNode 树（递归） */
export function normalizeRemoteMenus(list: RemoteMenuNode[]): MenuNode[] {
  const walk = (nodes: RemoteMenuNode[]): MenuNode[] =>
    nodes.filter(isVisible).map((node) => {
      const path = pickString(node.path, node.url)
      const children = node.children?.length ? walk(node.children) : undefined
      return {
        key: buildKey(node, path),
        title: pickString(node.name, node.menuName, node.label) || '(未命名菜单)',
        // 有子菜单的是分组，自身不跳转
        routePath: children?.length ? undefined : path,
        sourcePath: path,
        permission: pickString(node.permission, node.perms),
        icon: node.icon,
        order: pickNumber(node.orderNum, node.sort),
        badge: node.badge,
        hidden: false,
        children
      } satisfies MenuNode
    })
  return walk(list)
}
