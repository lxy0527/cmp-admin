/**
 * localStorage 薄封装
 * ------------------------------------------------------------
 * 为什么手写而不用 pinia 持久化插件：
 *   1. 只存 token / userInfo 两三个字段，插件带来的依赖和配置不值得；
 *   2. 需要一个统一的 key 前缀，便于以后整体清理或换存储位置（如 sessionStorage）。
 *
 * ⚠️ localStorage 只能放**非敏感**信息：token 放这里有 XSS 读取风险。
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
