/**
 * 本地存储薄封装（localStorage）
 * ------------------------------------------------------------
 * 为什么手写而不用 pinia 持久化插件：
 *   1. 只存 token / userInfo 两三个字段，插件带来的依赖和配置不值得；
 *   2. 需要一个统一的 key 前缀，便于以后整体清理或换存储位置。
 *
 * ★ 存储位置的历史（别再改了，除非有明确理由）：
 *   2026-10-17 曾短暂改成 sessionStorage（当时误以为后端要求 sessionStorage），
 *   后来确认后端说的是 **服务端 Session**（`Session["loginUserId"]`，存在服务器上），
 *   跟浏览器的 localStorage / sessionStorage 是两回事，于是改回 localStorage。
 *
 *   两者在**安全性上没有区别**：都是明文，F12 里可读可改。
 *   sessionStorage 唯一的区别是"关标签页即失效"，代价是开新标签页也要重新登录，日常更烦。
 *
 * ⚠️ 真正的身份校验必须在**后端**做（从服务端 Session 取用户 Id，别信前端传的 UserId）。
 *    前端存什么、加不加密，都不构成任何安全保证。
 *    后端就绪后如果要求更严，改成 httpOnly Cookie + 后端会话即可，
 *    届时只需替换本文件与 api/request.ts 里的取 token 逻辑，业务代码不用动。
 */

/** 统一的 key 前缀，避免和同域下其它应用打架 */
const PREFIX = 'cmp-admin:'

export const storage = {
  /** 读取并反序列化；key 不存在时返回 defaultValue（而不是 null，省掉调用处的判空） */
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return defaultValue
    try {
      return JSON.parse(raw) as T
    } catch {
      // 兼容历史上直接写入的裸字符串（非 JSON）
      return raw as unknown as T
    }
  },

  /** 写入（统一 JSON 序列化，保证 get 能对称解析） */
  set(key: string, value: unknown) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },

  /** 删除单个 key */
  remove(key: string) {
    localStorage.removeItem(PREFIX + key)
  }
}
