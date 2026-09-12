import { defineStore } from 'pinia'
import { getUserInfoApi, loginApi, logoutApi, type LoginParams, type UserInfo } from '@/api/auth'
import { storage } from '@/utils/storage'
import { TOKEN_KEY } from '@/api/request'
import { checkPermission, resolvePermissions } from '@/config/permission'
import { useMenuStore } from './menu'

/**
 * 用户态
 * ------------------------------------------------------------
 * 与守卫的分工（都在这一个 slice 里体现）：
 *   - token     → 认证（Authentication）：有没有登录
 *   - userInfo  → 身份（Identity）：我是谁、什么角色
 *   - permissions → 授权（Authorization）：我能干什么
 *
 * 持久化用最土的办法（localStorage 手动读写），没引 pinia 持久化插件：
 * 依赖少、行为可控，刷新后由路由守卫负责把 userInfo 补回来。
 */

interface UserState {
  token: string
  userInfo: UserInfo | null
}

/** localStorage 里缓存的用户信息 key（与 token 分开存，便于单独失效） */
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    // 初始值直接从 localStorage 恢复，这样刷新页面不会先闪到登录页
    token: storage.get<string>(TOKEN_KEY, '') || '',
    userInfo: storage.get<UserInfo | null>(USER_INFO_KEY, null) || null
  }),

  getters: {
    /** 是否已登录（只判断"有没有 token"，token 是否有效由后端定） */
    isLogin: (state) => Boolean(state.token),

    /** 顶栏显示的名字 */
    nickname: (state) => state.userInfo?.nickname || '未登录',

    /** 角色列表（后端下发，用于展示/排查，不直接当权限用） */
    roles: (state) => state.userInfo?.roles || [],

    /**
     * 最终权限点集合
     * 计算优先级：后端下发 permissions > 角色映射表（见 config/permission.ts）
     * 用普通函数（而非箭头）以便拿 this 推断类型
     */
    permissions(state): string[] {
      return resolvePermissions(state.userInfo)
    },

    /** 是否拥有某权限点（页面/按钮统一走这个，别在各处自己判断 role） */
    hasPermission() {
      return (required?: string | string[]) => checkPermission(this.permissions, required)
    }
  },

  actions: {
    /** 登录：拿 token → 立刻拉一次用户信息（顺带把权限拿到手） */
    async login(params: LoginParams) {
      const { token } = await loginApi(params)
      this.token = token
      storage.set(TOKEN_KEY, token)
      await this.fetchUserInfo()
      return token
    },

    /** 拉取用户信息（守卫在刷新后也会调它） */
    async fetchUserInfo() {
      if (!this.token) return null
      const info = await getUserInfoApi(this.token)
      this.userInfo = info
      storage.set(USER_INFO_KEY, info)
      return info
    },

    /**
     * 退出登录
     * 用 try/finally：即使退出接口报错，本地状态也必须清干净，
     * 否则会出现"退不出去"的死状态。
     * 同时清掉菜单：菜单是按角色下发的，换用户必须重新拉，否则会串味。
     */
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.reset()
        useMenuStore().reset()
      }
    },

    /** 清空本地登录态（401 拦截器也会调它） */
    reset() {
      this.token = ''
      this.userInfo = null
      storage.remove(TOKEN_KEY)
      storage.remove(USER_INFO_KEY)
    }
  }
})
