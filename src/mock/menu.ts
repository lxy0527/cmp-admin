/**
 * 后端下发菜单 —— 假数据
 * ============================================================
 * 作用：**证明"换源不改渲染层"是成立的**。
 * 这份数据的形状刻意做得跟静态配置不同（字段名不同、带多层嵌套、带 icon/badge/隐藏项），
 * 归一化后却能在同一个渲染层里正常显示。
 *
 * 想亲眼验证：
 *   1. 在 `.env.development.local` 写 `VITE_MENU_SOURCE=auto`
 *   2. 重启 dev server，用 admin 登录 → 左侧菜单会变成下面这棵树
 *      （观察点：出现了二级分组「现场监测」，以及带角标的项）
 *   3. 用 viewer 登录 → 只剩 Dashboard/Data Receiving，且没有管理类菜单/角标
 *
 * ⚠️ 这些菜单名是**演示用的编造数据**，不是真实需求。
 */
import type { RemoteMenuNode } from '@/config/menuTree'
import { delay } from './helper'

/** 从 localStorage 读当前用户角色（mock 里没有 store 上下文，只能这样拿） */
function currentRoles(): string[] {
  try {
    const raw = localStorage.getItem('cmp-admin:userInfo')
    if (!raw) return []
    return (JSON.parse(raw) as { roles?: string[] })?.roles || []
  } catch {
    return []
  }
}

/** 超级管理员：完整树（含二级分组、图标、角标） */
const ADMIN_MENU: RemoteMenuNode[] = [
  {
    id: 1,
    menuName: 'Data Receiving',
    path: '/data-receiving',
    icon: 'data',
    orderNum: 1,
    children: [
      {
        id: 11,
        menuName: 'Permitted to Work',
        path: '/data-receiving/permitted-to-work',
        orderNum: 1,
        badge: 12
      },
      { id: 12, menuName: 'VR Training', path: '/data-receiving/vr-training', orderNum: 9 },
      {
        // 二级分组：静态配置里没有这层，用来验证递归渲染
        id: 13,
        menuName: '现场监测',
        path: '/data-receiving/monitoring',
        orderNum: 2,
        icon: 'monitor',
        children: [
          {
            id: 131,
            menuName: 'Smart Monitoring for Frontline',
            path: '/data-receiving/smart-monitoring-for-frontline'
          },
          {
            id: 132,
            menuName: 'Safety Monitoring Sys Using AI',
            path: '/data-receiving/safety-monitoring-sys-using-ai'
          },
          {
            id: 133,
            menuName: 'Confined Space Monitoring',
            path: '/data-receiving/confined-space-monitoring',
            badge: 'NEW'
          }
        ]
      },
      {
        id: 14,
        menuName: 'Digitized Tracking',
        path: '/data-receiving/digitized-tracking',
        orderNum: 3
      },
      // 隐藏项：有路径、有权限，但不在菜单里显示（验证 hidden 生效）
      {
        id: 15,
        menuName: 'E-Lock and Key Sys',
        path: '/data-receiving/e-lock-and-key-sys',
        visible: 0
      }
    ]
  },
  {
    id: 2,
    menuName: 'CMP Setting',
    path: '/cmp-setting',
    icon: 'setting',
    orderNum: 2,
    children: [
      { id: 21, menuName: '用户管理', path: '/cmp-setting/users', perms: 'user:query', orderNum: 1 },
      { id: 22, menuName: '角色管理', path: '/cmp-setting/roles', perms: 'role:query', orderNum: 2 },
      { id: 23, menuName: '报警信息管理', path: '/cmp-setting/alarm-info', perms: 'alarm:info' },
      { id: 24, menuName: '图片报警管理', path: '/cmp-setting/alarm-image', perms: 'alarm:image' },
      { id: 25, menuName: '推送地址', path: '/cmp-setting/push-address', perms: 'push:address' }
    ]
  }
]

/** 只读角色：后端只下发它能看的菜单（不给管理类节点） */
const VIEWER_MENU: RemoteMenuNode[] = [
  {
    id: 1,
    menuName: 'Data Receiving',
    path: '/data-receiving',
    icon: 'data',
    children: [
      { id: 11, menuName: 'Permitted to Work', path: '/data-receiving/permitted-to-work' },
      { id: 12, menuName: 'VR Training', path: '/data-receiving/vr-training' }
    ]
  }
]

/** 拉取"后端菜单树"（假实现） */
export async function mockFetchRemoteMenus(): Promise<RemoteMenuNode[]> {
  await delay(200)
  const roles = currentRoles()
  if (roles.includes('超级管理员')) return ADMIN_MENU
  if (roles.includes('观察者_Viewer')) return VIEWER_MENU
  // 没匹配到角色：返回空数组，store 会回退到静态配置（不会白屏）
  return []
}
