/**
 * 认证相关接口
 * ------------------------------------------------------------
 * 每个方法都是"双分支"结构，方便逐个切真实接口：
 *   if (USE_MOCK) → 走本地假数据
 *   否则          → 走 axios 真实请求（URL 已按 REST 风格写在注释/代码里）
 *
 * 后端接口就绪后的改法：删掉 USE_MOCK 那一支即可，函数签名和返回类型都不用动。
 */
import { request, USER_TOKEN_KEY, authHeader } from './request'
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
 * 用户级鉴权已确认走 **token**（后端 2026-10-17 文档）：
 *   响应体**顶层**会多一个 token（与 data 平级，**不在 data 里面**）：
 *     {"code":"SUCCESS","message":"OK","token":"xxx","data":{...}}
 *   之后每个请求带 `Authorization: Bearer <token>`，
 *   所有"按登录账号返回数据"的接口改用它识别身份，不再传 UserId。
 *
 * @returns token（前端登录标记）+ info（用户信息，含 Role）+ userToken（后端凭据）
 */
export async function loginApi(
  params: LoginParams
): Promise<{ info?: UserInfo; userToken: string }> {
  if (USE_MOCK) {
    const res = await mockLogin(params)
    if (!res) throw new Error('用户名或密码错误')
    return res
  }

  const res = await request<BackendLoginData>({
    url: '/userLogin',
    method: 'post',
    data: { UserName: params.username, Password: params.password }
  })
  const data = res.data

  // 文档：ReturnCode 成功返回 SUCCESS，失败返回具体原因（不是 HTTP 状态码）
  if (!data || data.ReturnCode !== 'SUCCESS') {
    throw new Error(data?.ReturnCode || '用户名或密码错误')
  }

  const role = Number(data.Role ?? 0)

  // ★ token 在返回体**顶层**（res.token），不是 data.token —— 2026-10-17 文档确认
  const userToken = String(res.token ?? '').trim()
  if (userToken) storage.set(USER_TOKEN_KEY, userToken)

  return {
    userToken,
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

/** `/api/userLogin` 的 data 部分（字段名照文档） */
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
}

/**
 * 取当前用户信息
 * ⚠️ 后端**没有**提供"当前登录用户"接口（文档里没有，也没有 session/JWT）。
 *    真实模式下只能沿用登录时缓存的用户信息；缓存丢了就让用户重新登录，
 *    绝不去猜一个角色 —— 猜错会导致越权或功能凭空消失。
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  if (USE_MOCK) {
    const res = await mockGetUserInfo()
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

/** 注册参数（2026-10-19 新增 VerifyCode 必填） */
export interface RegisterParams {
  UserName: string
  Email: string
  Password: string
  /** 文档：字段必须传，值可以为空（"不经过邀请码则手机号码必填"） */
  Tele?: string
  /** 邮箱收到的验证码 */
  VerifyCode: string
}

/** 邮件使用场景，后端只认这两个值 */
export type MailScene = 'Register' | 'ChangePassword'

/**
 * 发送验证码：POST /api/email
 * 请求：{ Email, Scene }  → 后端**用自己配置的 SMTP 发信**（前端永远拿不到授权码）
 * 响应：顶层 `token`，**10 分钟有效、只能用一次**
 *
 * 这个 token 不是登录 token，只用来证明"这个邮箱确实是他的"，
 * 提交注册 / 改密码时放在 `Authorization` 头里，用完即废。
 *
 * ⚠️ 演示/本地开发一律走假 token —— 文档明确写了"不要频繁测试，以免风控把邮箱拉入黑名单"。
 *    只有「关掉 mock 且关掉演示模式」时才会真的发信。
 */
export async function sendVerifyCodeApi(Email: string, Scene: MailScene): Promise<string> {
  if (USE_MOCK || DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500))
    return `mock-verify-token-${Date.now()}`
  }
  const res = await request<{ ReturnCode?: string }>({
    url: '/email',
    method: 'post',
    data: { Email, Scene }
  })
  const token = String(res.token ?? '').trim()
  if (!token) throw new Error('未拿到验证 token，请重试')
  return token
}

/**
 * 修改密码 / 找回密码：POST /api/changePassword
 *
 * 字段已按文档确认（2026-10-19）：
 *   Email      必传 —— 收验证码的邮箱
 *   Password   必传 —— **新密码**（字段名就叫 Password，不是 NewPassword）
 *   VerifyCode 必传 —— 邮件里的 6 位验证码
 * 请求头：`Authorization: Bearer <发邮件拿到的一次性 token>`
 *
 * 文档另注：*超级管理员添加账号也通用*（跟 /userRegister 一样）。
 *
 * @param verifyToken 发邮件（Scene: 'ChangePassword'）拿到的一次性 token
 */
export async function changePasswordApi(
  params: { Email: string; Password: string; VerifyCode: string },
  verifyToken?: string
): Promise<void> {
  if (USE_MOCK || DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 500))
    return
  }
  await request({
    url: '/changePassword',
    method: 'post',
    data: {
      Email: params.Email,
      Password: params.Password,
      VerifyCode: params.VerifyCode
    },
    headers: verifyToken ? authHeader(verifyToken) : undefined
  })
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

/**
 * 注册：POST /api/userRegister
 * @param verifyToken 发邮件拿到的一次性 token —— 放在 `Authorization` 头里
 *                    （拦截器会尊重显式指定的头，不会用登录 token 覆盖）
 */
export async function registerApi(params: RegisterParams, verifyToken?: string): Promise<void> {
  if (DEMO_MODE) return demoRegister(params)
  await request({
    url: '/userRegister',
    method: 'post',
    data: {
      UserName: params.UserName,
      Email: params.Email,
      Password: params.Password,
      Tele: params.Tele ?? '',
      VerifyCode: params.VerifyCode
    },
    headers: verifyToken ? authHeader(verifyToken) : undefined
  })
}

/**
 * 找回密码 —— **接口不存在**，这里故意不实现请求。
 * 保留这个函数是为了让页面有个明确的落点，等后端给了接口只要填这里。
 */
export async function requestPasswordResetApi(_account: string): Promise<never> {
  throw new Error('NO_API')
}
