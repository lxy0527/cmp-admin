/**
 * 认证相关接口
 * ------------------------------------------------------------
 * 每个方法都是"双分支"结构，方便逐个切真实接口：
 *   if (USE_MOCK) → 走本地假数据
 *   否则          → 走 axios 真实请求（URL 已按 REST 风格写在注释/代码里）
 *
 * 后端接口就绪后的改法：删掉 USE_MOCK 那一支即可，函数签名和返回类型都不用动。
 */
import { request } from './request'
import { USE_MOCK, mockGetUserInfo, mockLogin, mockLogout } from '@/mock'
import type { LoginParams, UserInfo } from '@/mock'

// 类型统一从 mock 转发（mock 与真实接口字段结构刻意保持一致，方便直接替换）
export type { LoginParams, UserInfo }

/**
 * 登录：POST /auth/login
 * @returns token；账号密码错误时抛错（由页面 catch 后提示）
 */
export async function loginApi(params: LoginParams): Promise<{ token: string }> {
  if (USE_MOCK) {
    const res = await mockLogin(params)
    if (!res) throw new Error('用户名或密码错误')
    return res
  }
  const { data } = await request<{ token: string }>({
    url: '/auth/login',
    method: 'post',
    data: params
  })
  return data
}

/**
 * 取当前用户信息：GET /auth/userinfo
 * 返回值里的 roles / permissions 决定了能看到哪些菜单和按钮（见 config/permission.ts）
 */
export async function getUserInfoApi(token: string): Promise<UserInfo> {
  if (USE_MOCK) {
    const res = await mockGetUserInfo(token)
    if (!res) throw new Error('获取用户信息失败')
    return res
  }
  const { data } = await request<UserInfo>({ url: '/auth/userinfo', method: 'get' })
  return data
}

/** 退出登录：POST /auth/logout（前端不依赖它的成败，见 store/user.ts 的 logout） */
export async function logoutApi(): Promise<void> {
  if (USE_MOCK) {
    await mockLogout()
    return
  }
  await request({ url: '/auth/logout', method: 'post' })
}
