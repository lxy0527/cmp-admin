/**
 * 会话辅助（给 api 层用）
 * ============================================================
 * api 层不能直接 `useUserStore()` —— store 反过来 import api，会绕成环。
 * 这里直接读持久化的 userInfo（走 utils/storage，它统一加了 `cmp-admin:` 前缀），
 * 好处是任何地方（包括非组件上下文）都能拿到，不依赖 Pinia 是否已初始化。
 *
 * ⚠️ 千万别直接 `localStorage.getItem('userInfo')` —— 真实 key 是
 *    `cmp-admin:userInfo`，读裸 key 永远拿到 null，会导致角色判断恒为"管理员"。
 *
 * 核心用途：**决定调哪套接口**
 *   Role = 1（后端管理员） → /alarm、/album、/customer                    看全部
 *   Role = 0（普通账号）   → /alarmByUser、/albumByUser、/customerByUser   只看自己公司
 * 文档里这套差异是硬性要求，不是可选项。
 */
import { storage } from '@/utils/storage'
import type { UserInfo } from '@/mock'

/** 与 store/user.ts 的 USER_INFO_KEY 保持一致 */
const USER_INFO_KEY = 'userInfo'

function readUser(): Partial<UserInfo> | null {
  try {
    return storage.get<Partial<UserInfo>>(USER_INFO_KEY) ?? null
  } catch {
    return null
  }
}

/** 当前登录账号 Id（普通账号查询必须带 UserId） */
export function getSessionUserId(): number {
  return Number(readUser()?.userId ?? 0) || 0
}

/** 后端 Role：0 普通账号 / 1 后端管理员 */
export function getSessionRole(): number {
  const role = readUser()?.role
  return typeof role === 'number' ? role : 1 // 拿不到就按管理员处理，避免误降权把功能藏掉
}

/**
 * 是否后端管理员（Role === 1）
 * 只有管理员能调"看全部数据"的那套接口。
 */
export function isAdmin(): boolean {
  return getSessionRole() === 1
}
