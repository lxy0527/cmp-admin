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
   * 后端 `Role`：**0 普通账号 / 1 后端管理员**
   * ⚠️ 这个字段决定调哪套接口（管理员用 /alarm、/album、/customer；
   *    普通账号只能用 /alarmByUser、/albumByUser、/customerByUser）。
   *    见 utils/session.ts 与各 api 模块里的分支。
   */
  role: number
  /**
   * 后端 `Permission`：0 普通账号 / 1 客户管理
   * 文档里是独立于 Role 的一个开关，先存下来，暂不参与路由。
   */
  permission?: number
  /**
   * 权限点列表
   * 后端就绪后请直接返回这个字段（前端 config/permission.ts 里的角色映射表就会被优先忽略），
   * 现在留空则由前端角色映射表兜底。
   */
  permissions?: string[]
}

/**
 * 演示账号
 * - admin  / 123456 ：**后端管理员**（Role=1），能看全部数据
 * - viewer / 123456 ：**普通账号**（Role=0），只能看自己关联公司的数据
 *   用来验证"角色分流"：登录 viewer 后会走 /alarmByUser、/albumByUser、/customerByUser
 *
 * 结构刻意跟后端将来要返回的结构保持一致，方便直接替换。
 */
const USERS: Record<string, { password: string; info: UserInfo }> = {
  admin: {
    password: '123456',
    info: {
      userId: 1,
      username: 'admin',
      nickname: 'kccm_data',
      roles: ['超级管理员'],
      role: 1,
      permission: 1
    }
  },
  viewer: {
    password: '123456',
    info: {
      userId: 2,
      username: 'viewer',
      nickname: 'ABLE_Viewer',
      roles: ['观察者_Viewer'],
      role: 0,
      permission: 0
    }
  }
}

/**
 * 登录校验（假实现）
 * @returns 成功返回 token，账号密码不匹配返回 null（由 api 层转成错误提示）
 *
 * 真实接口：POST /auth/login
 */
interface MockLoginOk {
  userToken: string
  info: UserInfo
}

/** mock 登录成功后记住是谁，供 mockGetUserInfo 使用（真实接口是按 token 识别，不需要"反解"） */
let currentMockUser = ''

export async function mockLogin(params: LoginParams): Promise<MockLoginOk | null> {
  await delay(360)
  const user = USERS[params.username]
  if (!user || user.password !== params.password) return null
  currentMockUser = params.username
  return { userToken: `mock-token-${params.username}-${Date.now()}`, info: user.info }
}

/**
 * 取当前用户信息（假实现）
 * 真实接口：后端按请求头里的 token 识别用户，前端不传参
 */
export async function mockGetUserInfo(): Promise<UserInfo | null> {
  await delay(120)
  return USERS[currentMockUser]?.info || null
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
