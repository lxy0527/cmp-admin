/**
 * axios 封装
 * ============================================================
 * 已按 CMP 真实接口校正（2026-10-15）。与最初"全是 mock"时相比，改动只有三处：
 *
 *   1. **返回码宽容判断**：后端目前有三套成功码（"SUCCESS" / 200 / 0），
 *      统一用 isApiSuccess() 兼容，等后端定死一种再收紧（只改这一个函数）。
 *   2. **不再强制带 token**：CMP 开放接口的鉴权是 ApiId/ApiKey（应用级），
 *      由 dev server 代理注入（见 vite.config.ts），前端拿不到也不需要。
 *      若将来后端加回用户级 token，第 41 行那支会自动生效。
 *   3. **识别"假成功"**：ApiId/ApiKey 缺失或域名未授权时，后端返回的是
 *      **302 → 它自己的 HTML 登录页**（不是 401 JSON）。axios 跟完重定向会拿到
 *      HTTP 200 + HTML，如果不识别就会被当成成功数据吐给页面。这里显式拦掉。
 *
 * 仍然刻意保持"薄"：不做请求取消/重试/队列/全局 loading —— 按页面自己控制。
 *
 * 文件下载（导出）仍要单独走 responseType: 'blob'，见下方已做的透传分支。
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { storage } from '@/utils/storage'
import { useUserStore } from '@/store/user'
import type { ApiCode, ApiResult } from '@/types/api'

/** token 在 localStorage 里的 key（前端自己的"已登录"标记） */
export const TOKEN_KEY = 'token'

/**
 * **后端下发的用户级身份 token** 的存储 key。
 * 与 TOKEN_KEY 分开存：TOKEN_KEY 只是前端用来判断"要不要跳登录页"的标记，
 * 而 userToken 是真正拿去后端认身份的凭据（后端用它反查 UserId，不再相信前端传的 UserId）。
 */
export const USER_TOKEN_KEY = 'userToken'

/**
 * token 放在哪个请求头里 —— **后端 2026-10-17 文档定为**：
 *   Authorization: Bearer <token>
 *
 * 仍保留可配置（万一以后改）：
 *   VITE_AUTH_TOKEN_HEADER=Authorization    （默认）
 *   VITE_AUTH_TOKEN_PREFIX=Bearer           （默认；代码会自动补中间的空格）
 */
const AUTH_TOKEN_HEADER = (import.meta.env.VITE_AUTH_TOKEN_HEADER as string) || 'Authorization'
const AUTH_TOKEN_PREFIX = (import.meta.env.VITE_AUTH_TOKEN_PREFIX as string) || 'Bearer'

/** 后端接口前缀：开发环境走 vite proxy，生产环境应指向自家后端网关 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 判断业务状态码是否为成功。
 * 兼容后端现存的三套约定（见 types/api.ts 顶部说明）：
 *   公开接口 "SUCCESS" ｜ 开放接收 200 ｜ 旧站后台 0
 */
export function isApiSuccess(code: ApiCode | undefined | null): boolean {
  if (code === undefined || code === null) return true
  if (typeof code === 'string') {
    const c = code.toUpperCase()
    return c === 'SUCCESS' || c === 'OK' || c === '0' || c === '200'
  }
  return code === 0 || code === 200
}

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000
})

/**
 * 请求拦截：带上后端下发的用户级 token（有就带，没有就不带）
 *
 * 之前这里发的是 `Authorization: Bearer <前端伪 token>` —— 那个 token 是前端自己造的，
 * 后端不认识，纯噪音还容易误导排查，已去掉。现在只发真凭据。
 */
service.interceptors.request.use((config) => {
  const userToken = storage.get<string>(USER_TOKEN_KEY)
  if (userToken) {
    config.headers = config.headers || {}
    // 前缀和 token 之间必须有空格；.env 会吃掉行尾空格，所以在这里补，别依赖配置里写 "Bearer "
    const value = AUTH_TOKEN_PREFIX ? `${AUTH_TOKEN_PREFIX} ${userToken}` : userToken
    ;(config.headers as Record<string, string>)[AUTH_TOKEN_HEADER] = value
  }
  return config
})

/** 响应拦截：拆包 + 统一错误提示 + 掉线处理 */
service.interceptors.response.use(
  (response) => {
    // 二进制流（导出/下载）直接透传，不能走下面的拆包逻辑
    const rt = response.config?.responseType
    if (rt === 'blob' || rt === 'arraybuffer') return response.data

    const res = response.data

    // 后端鉴权失败时返回的 HTML 登录页：必须拦掉，否则会被当成"成功的数据"
    if (typeof res === 'string' && res.trimStart().startsWith('<')) {
      const msg = '接口未授权（请检查 ApiId / ApiKey 与开放域名白名单）'
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }

    // 不是标准返回结构（例如直接吐数组）→ 原样返回，交给业务层
    if (!res || typeof res !== 'object' || !('code' in res)) return res

    const result = res as ApiResult
    if (!isApiSuccess(result.code)) {
      const msg = result.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }
    return result
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      // 掉线：清干净本地状态再回登录页（用 store 而不是直接删 storage，保证内存态一起清）
      ElMessage.error('登录已过期，请重新登录')
      useUserStore().reset()
      router.replace('/login')
    } else if (status === 403) {
      // 实测：开放域名不在白名单时后端返回 403 + {"code":"FAIL","message":"域名为授权"}
      ElMessage.error(error?.response?.data?.message || '域名未授权')
    } else {
      ElMessage.error(error?.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

/**
 * 业务层统一调用的入口：`const { data } = await request<T>({ url, method })`
 * ⚠️ 注意：CMP 开放接口**几乎全是 POST**（含查询），GET 只用于个别文档类接口。
 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  return service.request<unknown, ApiResult<T>>(config)
}

export default service
