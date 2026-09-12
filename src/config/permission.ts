/**
 * 权限点注册表（Permission Registry）
 * ============================================================
 * 设计意图：
 *   1. 权限点字符串**只在这里定义一次**，其它地方一律引用 `P.xxx`，避免各处手写字符串导致拼写漂移。
 *   2. 权限点名字只是"占位示例"，等后端给出真实权限清单后，只改本文件的 key 即可，
 *      上游（路由 meta / 按钮指令 / 菜单）不用动。
 *
 * 权限点命名约定（建议，跟后端对齐时沿用）：
 *   `模块:动作`，例如 role:add / role:edit / role:delete
 *
 * ---------------- 待后端确认（重要） ----------------
 *   - 权限点最终由后端下发还是前端写死？倾向后端下发（见 ROLE_PERMISSIONS 注释）
 *   - 是否细分到"查看(query)"？还是不加 query 权限点、只要能进页面就能看？
 *   - 数据权限（只能看自己项目/区域的数据）如何表达？当前未涉及。
 */
export const P = {
  /** CMP Setting 模块下的管理类功能：登录后**不默认**可见，需要显式授权 */
  /** 用户管理：查询 */
  userQuery: 'user:query',
  /** 用户管理：增删改 */
  userEdit: 'user:edit',
  /** 角色管理：查询 */
  roleQuery: 'role:query',
  /** 角色管理：新增 */
  roleAdd: 'role:add',
  /** 角色管理：编辑 */
  roleEdit: 'role:edit',
  /** 角色管理：删除 */
  roleDelete: 'role:delete',
  /** 报警信息管理 */
  alarmInfo: 'alarm:info',
  /** 图片报警管理 */
  alarmImage: 'alarm:image',
  /** 推送地址配置 */
  pushAddress: 'push:address',

  /**
   * Data Receiving 模块：登录后默认可见（现场数据页，先不细分权限）
   * 留成显式常量而不是"不填"，是为了让"这个页面到底要不要权限"这件事一目了然，
   * 而不是靠"忘了配"来决定。
   */
  dataReceivingView: 'data:view'
} as const

export type PermissionCode = (typeof P)[keyof typeof P]

/**
 * 角色 → 权限 的映射表（**临时实现**）
 * ------------------------------------------------------------
 * 为什么写在前端：现在还没有接口，但守卫/按钮的权限判断链路需要先跑通。
 *
 * 后端就绪后应该改成：
 *   - 登录后由 `/auth/userinfo` 直接返回 `permissions: string[]`（首选），
 *     此时 `resolvePermissions()` 会自动优先使用后端返回值，本文件即可删掉；
 *   - 或由后端提供"角色-权限"配置接口，前端拉取后缓存。
 *
 * 注意：把权限表放前端只是为了显示控制（按钮隐藏等），**真正的鉴权必须在后端**，
 *      前端隐藏按钮不等于安全。
 */
export const ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  // 全权限角色
  超级管理员: [
    P.dataReceivingView,
    P.userQuery,
    P.userEdit,
    P.roleQuery,
    P.roleAdd,
    P.roleEdit,
    P.roleDelete,
    P.alarmInfo,
    P.alarmImage,
    P.pushAddress
  ],
  // 现场只读角色：能看 Data Receiving，不能进 CMP Setting（用来演示按权限隐藏整个模块 Tab）
  观察者_Viewer: [P.dataReceivingView]
}

/** 未匹配到任何角色时的兜底权限（空数组 = 什么都不给，避免"没配就等于全给"的低级漏洞） */
const FALLBACK: PermissionCode[] = []

export interface PermissionSource {
  roles?: string[]
  /** 后端下发的权限点，优先于角色映射表 */
  permissions?: string[]
}

/**
 * 计算某个用户的最终权限点集合
 * 优先级：后端下发的 permissions > 角色映射表 > 兜底
 */
export function resolvePermissions(user?: PermissionSource | null): string[] {
  if (!user) return FALLBACK
  if (user.permissions?.length) return [...user.permissions]
  const fromRoles = (user.roles || []).flatMap((role) => ROLE_PERMISSIONS[role] || [])
  return fromRoles.length ? [...new Set(fromRoles)] : FALLBACK
}

/** 判断权限集合里是否包含某个权限点（不做通配符，保持简单） */
export function checkPermission(owned: string[], required?: string | string[]): boolean {
  if (!required) return true // 没配权限点的页面 = 登录后即可访问
  const need = Array.isArray(required) ? required : [required]
  // 任一命中即通过（需要"同时满足多个"时再改这里）
  return need.some((code) => owned.includes(code))
}
