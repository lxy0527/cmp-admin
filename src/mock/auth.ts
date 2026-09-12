import { delay } from './helper'

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  userId: number
  username: string
  nickname: string
  roles: string[]
  /**
   * 权限点列表
   * 后端就绪后请直接返回这个字段（前端 config/permission.ts 里的角色映射表就会被优先忽略），
   * 现在留空则由前端角色映射表兜底。
   */
  permissions?: string[]
}

/**
 * 演示账号
 * - admin / 123456 ：超级管理员（全权限）
 * - viewer / 123456：只读观察者（只有 role:query，用来验证按权限隐藏菜单/按钮）
 *
 * 结构刻意跟后端将来要返回的结构保持一致，方便直接替换。
 */
const USERS: Record<string, { password: string; info: UserInfo }> = {
  admin: {
    password: '123456',
    info: { userId: 1, username: 'admin', nickname: 'kccm_data', roles: ['超级管理员'] }
  },
  viewer: {
    password: '123456',
    info: { userId: 2, username: 'viewer', nickname: 'ABLE_Viewer', roles: ['观察者_Viewer'] }
  }
}

/**
 * 登录校验（假实现）
 * @returns 成功返回 token，账号密码不匹配返回 null（由 api 层转成错误提示）
 *
 * 真实接口：POST /auth/login
 */
export async function mockLogin(params: LoginParams): Promise<{ token: string } | null> {
  await delay(360)
  const user = USERS[params.username]
  if (!user || user.password !== params.password) return null
  // token 里塞进用户名，纯粹为了 mockGetUserInfo 能"反解"出当前用户
  return { token: `mock-token-${params.username}-${Date.now()}` }
}

/**
 * 取当前用户信息（假实现）
 * 真实接口：GET /auth/userinfo（真实场景是靠请求头里的 token 识别用户，不需要传参）
 */
export async function mockGetUserInfo(token: string): Promise<UserInfo | null> {
  await delay(120)
  const username = token.split('-')[2]
  return USERS[username]?.info || null
}

/**
 * 退出登录（假实现）
 * 真实接口：POST /auth/logout
 * 注意：前端退出不该依赖这个接口成功与否，本地状态一律要清（见 store/user.ts）
 */
export async function mockLogout() {
  await delay(120)
  return true
}
