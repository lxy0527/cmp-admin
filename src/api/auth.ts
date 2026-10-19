/**
 * 认证相关接口
 * ------------------------------------------------------------
 * 每个方法都是"双分支"结构，方便逐个切真实接口：
 *   if (USE_MOCK) → 走本地假数据
 *   否则          → 走 axios 真实请求（URL 已按 REST 风格写在注释/代码里）
 *
 * 后端接口就绪后的改法：删掉 USE_MOCK 那一支即可，函数签名和返回类型都不用动。
 */
import { request, USER_TOKEN_KEY } from './request'
import { storage } from '@/utils/storage'
import { USE_MOCK, mockGetUserInfo, mockLogin, mockLogout } from '@/mock'
import type { LoginParams, UserInfo } from '@/mock'
import { DEMO_MODE, demoCheckAccountAvailable, demoRegister } from '@/demo'

// 类型统一从 mock 转发（mock 与真实接口字段结构刻意保持一致，方便直接替换）
export type { LoginParams, UserInfo }

/**
 * 登录：POST /api/userLogin
 * 文档：UserName 可以传**账号或 Email**。
 *
 * 用户级鉴权已确认走 **token**（后端 2026-10-17 决定）：
 *   登录成功后后端返回一个随机串，前端存起来，之后每个请求都带上，
 *   后端拿它反查 UserId —— 这样客户端就没法靠改 UserId 冒充别人。
 *
 * ⚠️ token 放在响应体的哪个字段，后端还没定死，这里做了兼容：
 *      data.Token / data.UserToken / data.token
 *    等后端确认字段名后，只留那一个即可（顺便让后端把它写进文档）。
 *
 * @returns token（前端登录标记）+ info（用户信息，含 Role）+ userToken（后端凭据）
 */
export async function loginApi(
  params: LoginParams
): Promise<{ token: string; info?: UserInfo; userToken?: string }> {
  if (USE_MOCK) {
    const res = await mockLogin(params)
    if (!res) throw new Error('用户名或密码错误')
    return res
  }

  const { data } = await request<BackendLoginData>({
    url: '/userLogin',
    method: 'post',
    data: { UserName: params.username, Password: params.password }
  })

  // 文档：ReturnCode 成功返回 SUCCESS，失败返回具体原因（不是 HTTP 状态码）
  if (!data || data.ReturnCode !== 'SUCCESS') {
    throw new Error(data?.ReturnCode || '用户名或密码错误')
  }

  const role = Number(data.Role ?? 0)

  // 后端下发的用户级 token：字段名还没定，先兼容几种常见写法
  const userToken = String(data.Token ?? data.UserToken ?? data.token ?? '').trim()
  if (userToken) storage.set(USER_TOKEN_KEY, userToken)

  return {
    token: `cmp-${data.Id}-${Date.now()}`,
    userToken: userToken || undefined,
    info: {
      userId: Number(data.Id ?? 0),
      username: data.UserName ?? params.username,
      nickname: data.Name || data.UserName || params.username,
      // Role 是数字，但菜单/权限体系目前按"角色名"匹配，这里做一次映射
      roles: role === 1 ? ['超级管理员'] : ['观察者_Viewer'],
      role,
      permission: Number(data.Permission ?? 0)
    }
  }
}

/** `/api/userLogin` 的响应体（字段名照文档；Token 系字段待后端确认） */
interface BackendLoginData {
  ReturnCode?: string
  Id?: number
  UserName?: string
  Email?: string
  Name?: string
  /** 0 普通账号 / 1 后端管理员 */
  Role?: number
  /** 0 普通账号 / 1 客户管理 */
  Permission?: number
  Head?: string | null
  Status?: number
  /** 用户级 token —— 具体字段名待后端确认 */
  Token?: string
  UserToken?: string
  token?: string
}

/**
 * 取当前用户信息
 * ⚠️ 后端**没有**提供"当前登录用户"接口（文档里没有，也没有 session/JWT）。
 *    真实模式下只能沿用登录时缓存的用户信息；缓存丢了就让用户重新登录，
 *    绝不去猜一个角色 —— 猜错会导致越权或功能凭空消失。
 */
export async function getUserInfoApi(token: string): Promise<UserInfo> {
  if (USE_MOCK) {
    const res = await mockGetUserInfo(token)
    if (!res) throw new Error('获取用户信息失败')
    return res
  }

  const cached = readCachedUserInfo()
  if (cached) return cached
  throw new Error('登录状态已失效，请重新登录')
}

/** 读 store 持久化的用户信息（走 storage 工具，key 前缀由它统一加） */
function readCachedUserInfo(): UserInfo | null {
  try {
    return storage.get<UserInfo>('userInfo') ?? null
  } catch {
    return null
  }
}

/** 退出登录：POST /auth/logout（前端不依赖它的成败，见 store/user.ts 的 logout） */
export async function logoutApi(): Promise<void> {
  if (USE_MOCK) {
    await mockLogout()
    return
  }
  await request({ url: '/auth/logout', method: 'post' })
}

/* ============================================================
 * 注册 / 找回密码
 * ============================================================
 * ⚠️ 一个重要事实（已核对接口文档，2026-10-17）：
 *   - 注册：**有**接口 → `/userRegister`，配套 `/userUnRegister` 校验账号是否被系统保留
 *   - 找回密码：**文档里完全没有**（找回/忘记/重置 四个关键词 0 命中）
 *     旧站后台有个未文档化的 `/cmp/account/password-reset`，新接口没给。
 *   所以「忘记密码」页只做界面 + 明确告知，**不假装发送邮件**。
 */

/** 注册参数 */
export interface RegisterParams {
  UserName: string
  Email: string
  Password: string
  Tele?: string
}

/**
 * 校验账号是否可用（能不能注册）
 * 对应接口：POST /api/userUnRegister  →  data.Valid === 'Yes' 才允许注册
 * @returns true = 可注册
 */
export async function checkAccountAvailableApi(UserName: string): Promise<boolean> {
  if (DEMO_MODE) return demoCheckAccountAvailable(UserName)
  const { data } = await request<{ Valid: string }>({
    url: '/userUnRegister',
    method: 'post',
    data: { UserName }
  })
  return data?.Valid === 'Yes'
}

/** 注册：POST /api/userRegister（文档：超级管理员添加账号也通用） */
export async function registerApi(params: RegisterParams): Promise<void> {
  if (DEMO_MODE) return demoRegister(params)
  await request({
    url: '/userRegister',
    method: 'post',
    data: {
      UserName: params.UserName,
      Email: params.Email,
      Password: params.Password,
      Tele: params.Tele ?? ''
    }
  })
}

/**
 * 找回密码 —— **接口不存在**，这里故意不实现请求。
 * 保留这个函数是为了让页面有个明确的落点，等后端给了接口只要填这里。
 */
export async function requestPasswordResetApi(_account: string): Promise<never> {
  throw new Error('NO_API')
}
