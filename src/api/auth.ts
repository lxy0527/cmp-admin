/**
 * 认证相关接口
 * ------------------------------------------------------------
 * 每个方法都是"双分支"结构，方便逐个切真实接口：
 *   if (USE_MOCK) → 走本地假数据
 *   否则          → 走 axios 真实请求（URL 已按 REST 风格写在注释/代码里）
 *
 * 后端接口就绪后的改法：删掉 USE_MOCK 那一支即可，函数签名和返回类型都不用动。
 */
import { request, USER_TOKEN_KEY, authHeader, isApiSuccess } from './request'
import { storage } from '@/utils/storage'
import { USE_MOCK, mockGetUserInfo, mockLogin, mockLogout } from '@/mock'
import type { LoginParams, UserInfo } from '@/mock'
import { DEMO_MODE, demoCheckAccount, demoCheckEmailAvailable, demoRegister } from '@/demo'

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

/**
 * 退出登录。
 *
 * ⚠️ **后端没有 logout 接口**（接口文档 48 页里没有这一项）。
 * 所以真实模式下这里**不打任何网络请求** —— 之前这里写的是
 * `POST /auth/logout`，真实模式点「退出登錄」会 404：
 * 控制台抛 uncaught AxiosError，右上角还弹一个红色
 * 「Request failed with status code 404」。
 *
 * 前端能做的只有把本地凭据清干净（由 store/user.ts 的 logout/finally 负责）。
 * token 在服务端何时失效、要不要做黑名单，属于后端的事；
 * 等他们真给了接口，在这里补一行 request 即可。
 */
export async function logoutApi(): Promise<void> {
  if (USE_MOCK) {
    await mockLogout()
  }
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

/** 账号校验结论 */
export type AccountCheck = 'ok' | 'taken' | 'reserved'

/**
 * 校验账号能否用来注册 —— 两件事都要查，缺一不可
 *
 * 后端 2026-10-21 新增了两个专用校验接口（文档 `verifyUserName.html` / `verifyEmail.html`）：
 *   - `POST /api/verifyUserName { UserName }` → `data.Valid`：Yes=可注册，No=账号已被注册
 *   - `POST /api/verifyEmail    { Email }`    → `data.Valid`：Yes=可注册，No=邮箱已被注册
 *
 * 但 `verifyUserName` 只查**账号表**，查不出「系统保留名单」（`userUnRegister` 那张表），
 * 所以账号可用时还要再问一次 `userUnRegister`，否则 `vision`/`root` 这类保留名会漏过去。
 *
 * 实测（真实后端）：
 *   verifyUserName: user01→No  admin→No  zzz_brand_new_2026→Yes
 *   userUnRegister: user01→Yes admin→No  zzz_brand_new_2026→Yes
 *
 * @returns 'ok' 可注册 / 'taken' 已被注册 / 'reserved' 系统保留名
 */
export async function checkAccountApi(UserName: string): Promise<AccountCheck> {
  if (USE_MOCK || DEMO_MODE) return demoCheckAccount(UserName)

  // ① 是否已被注册：POST /api/verifyUserName → Valid='No' 表示已被注册
  const { data: nameData } = await request<{ Valid: string }>({
    url: '/verifyUserName',
    method: 'post',
    data: { UserName }
  })
  if (nameData?.Valid !== 'Yes') return 'taken'

  // ② 是否系统保留名：Valid === 'Yes' 才允许注册
  //    （`verifyUserName` 只查账号表，查不出「系统保留名单」，所以要单独再问一次）
  const { data } = await request<{ Valid: string }>({
    url: '/userUnRegister',
    method: 'post',
    data: { UserName }
  })
  return data?.Valid === 'Yes' ? 'ok' : 'reserved'
}

/**
 * 校验**邮箱**是否已被占用（一个邮箱只能绑一个账号）
 *
 * 后端 2026-10-21 新增专用接口（文档 `verifyEmail.html`）：
 *   POST /api/verifyEmail { Email } → `data.Valid`：Yes=可注册，No=邮箱已被注册
 *
 * ⚠️ 之前借用 `/api/userSingle { Email }` 有两个毛病，现在都解决了：
 *   1. 命中时会返回**整个用户对象**（含姓名/手机号）—— 查重根本用不到，属信息暴露；
 *   2. 靠"接口报错"判断有没有人用，语义反着来，容易误判。
 *
 * 真正的把关仍在**后端**（`Email` 唯一索引 + `/api/email` 发信前校验 +
 * `/api/userRegister` 提交时再校验）。前端查重只为了即时提示，
 * 查不到/查失败都不能拦住注册，兜底交给后端。
 *
 * @returns true = 可用（没被占用）
 */
export async function checkEmailAvailableApi(Email: string): Promise<boolean> {
  if (USE_MOCK || DEMO_MODE) return demoCheckEmailAvailable(Email)
  const { data } = await request<{ Valid: string }>({
    url: '/verifyEmail',
    method: 'post',
    data: { Email }
  })
  return data?.Valid === 'Yes'
}

/**
 * 服务端权限校验用的角色值（文档 `permission.html`）
 * - `Admin`         超级管理员（admin 账号）
 * - `CustomerAdmin` 客户管理员（能改自己关联公司的资料、能改警报状态）
 *
 * 文档注明：**admin 账号发 `CustomerAdmin` 也会通过**（超管包含客户管理员能力）。
 */
export type ServerPermission = 'Admin' | 'CustomerAdmin'

/**
 * 服务端权限判定的三种结论
 * - `granted` 后端明确给了 SUCCESS
 * - `denied`  后端明确拒绝（403 这类标准语义）
 * - `unknown` 后端没给出可判读的结论（302 跳登录页 / 空响应 / 连不上）
 *              —— 不能当成"你没权限"，否则后端一没实现好，管理员也进不去
 */
export type PermissionVerdict = 'granted' | 'denied' | 'unknown'

/**
 * 服务端鉴权：POST /api/permission
 *
 * 文档原话：
 *   - 传登录 token → 后端验证通过 → 返回 JSON
 *   - **验证失败不返回 JSON（避免被篡改），只返回 HTTP 状态码**：401 / 403 / 400 / 405
 *
 * 实测（真实后端，2026-10-21，同一天同一接口对照两个账号，逐字节看原始响应）：
 *
 * | 请求 | 响应 |
 * |---|---|
 * | admin 的 token + `{"Permission":"Admin"}` | `200 {"code":"SUCCESS","data":{"ReturnCode":"SUCCESS"}}` |
 * | user01 的 token + `{"Permission":"Admin"}` | `302 Found` → `location: /Account/Login?ReturnUrl=%2fapi%2fpermission`，body 是 `Object moved` 的 HTML |
 * | 任意 token + `{"Permission":"Whatever"}` | `403`（无 body） |
 *
 * **结论：302 就是后端「没有该权限」的失败通道，不是"后端没实现好"。**
 * 它确实是旧 MVC 那套 `Response.Redirect("~/Account/Login")` 的写法（语义上像"你没登录"），
 * 但既然同一时刻 admin 能拿到 200 SUCCESS，就说明它**认了 `Authorization` 头**，
 * 只是用 302 来表达"拒绝"。所以前端必须把这种情况判成**拒绝**，不能放行。
 *
 * 浏览器/axios 会自动跟随这个 302 → 落到本站的 `/Account/Login`（前端没有这个路由）→
 * 被 SPA 回退成 `index.html` → 表现为「接口返回了一坨 HTML」，
 * 于是由 `api/request.ts` 的 HTML 检测拦成 `接口未授权` 错误。
 *
 * ⚠️ 用 `silent: true`：这个请求失败属于"没权限"，不该弹"域名未授权"，
 *    更不该因为 401 就把人踢下线（见 api/request.ts 的 silent 分支）。
 */
export async function checkPermissionApi(Permission: ServerPermission): Promise<PermissionVerdict> {
  if (USE_MOCK || DEMO_MODE) return 'granted'
  try {
    const res = await request<{ ReturnCode?: string }>({
      url: '/permission',
      method: 'post',
      data: { Permission },
      silent: true
    })
    const ok = isApiSuccess(res.code) && (res.data?.ReturnCode ?? 'SUCCESS') === 'SUCCESS'
    // 200 但没有可判读的 JSON（空响应体等）→ 问不出结论
    return ok ? 'granted' : 'unknown'
  } catch (e) {
    const status = (e as { response?: { status?: number } })?.response?.status

    // 401/403 是有标准语义的明确拒绝：未认证 / 无权限
    if (status === 401 || status === 403) return 'denied'

    // 302 → 跳它自己的登录页，被拦截器拦成"接口未授权"。
    // 实测同一请求 admin 拿 200 SUCCESS、user01 拿 302 → 这就是"无权限"的失败通道。
    const msg = String((e as Error)?.message || '')
    if (msg.includes('接口未授权')) return 'denied'

    // 400/405（契约没对齐）、空响应、超时断网 → 问不出结论，不阻断，
    // 否则后端一抖整站进不去。这不是"授予权限"，页面里每个写操作后端仍会各自校验。
    return 'unknown'
  }
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


