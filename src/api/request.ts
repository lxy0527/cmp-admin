/**
 * axios 封装
 * ============================================================
 * ⚠️ 现状与刻意保持的"薄"：
 *   现在全部走 mock，所有 `request()` 调用都不会真的发出网络请求。
 *   所以这里**不做**过度设计（不搞请求取消、重试、队列、loading 计数器、多实例……），
 *   因为接口规范没到位之前写这些都是猜，等拿到后端文档必然大改。
 *
 * 目前只承担三件事（这三件是确定要有的）：
 *   1. baseURL / 超时 统一配置
 *   2. 请求头自动带 token（认证）
 *   3. 响应统一拆包 + 401 自动清理登录态并跳登录页
 *
 * ---------------- 拿到接口文档后要补的（To-Do） ----------------
 *   - 确认返回结构：现在假定 `{ code, data, message }`（见 types/api.ts），若不同只改本文件
 *   - 业务错误码表：除 401 外，还有哪些码需要特殊处理（如 403 无权限、425 重复提交）
 *   - 是否需要统一 loading（建议不要全局，按页面自己控制）
 *   - 是否需要请求去重 / 取消（列表页快速切筛选时会有用）
 *   - 是否需要 mock 与真实接口**同时存在**（按 URL 前缀分流，而不是全局开关）
 *   - 文件下载（导出）要单独走 responseType: 'blob'，不能复用这套拆包逻辑
 */
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { storage } from '@/utils/storage'
import { useUserStore } from '@/store/user'
import type { ApiResult } from '@/types/api'

/** token 在 localStorage 里的 key */
export const TOKEN_KEY = 'token'

/** 后端接口前缀：开发环境可配合 vite proxy，生产环境可配成完整域名 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const service: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000
})

/** 请求拦截：带上 token（认证层，与守卫的职责对应） */
service.interceptors.request.use((config) => {
  const token = storage.get<string>(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 响应拦截：拆包 + 统一错误提示 + 401 掉线处理 */
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResult
    // 只有"带业务码"的响应才做 code 判断，避免把二进制流等当成失败
    if (res && typeof res.code === 'number' && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return response.data
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      // 掉线：清干净本地状态再回登录页（用 store 而不是直接删 storage，保证内存态一起清）
      ElMessage.error('登录已过期，请重新登录')
      useUserStore().reset()
      router.replace('/login')
    } else {
      ElMessage.error(error?.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

/** 业务层统一调用的入口：`const { data } = await request<T>({ url, method })` */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResult<T>> {
  return service.request<unknown, ApiResult<T>>(config)
}

export default service
