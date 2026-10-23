import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { MODULES } from '@/config/menu'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'
import { checkPermission } from '@/config/permission'
import { checkPermissionApi, type ServerPermission } from '@/api/auth'

// 路由懒加载：布局 / 兜底页只引一次，业务页面走 menu 配置动态展开
const MainLayout = () => import('@/layout/MainLayout.vue')
const MenuPlaceholder = () => import('@/views/placeholder/MenuPlaceholder.vue')
const views = import.meta.glob('@/views/**/*.vue')

/**
 * 从 menu 配置动态展开子路由
 * - 菜单项写了 component → 用真实页面
 * - 没写 component      → 统一走占位页（这样加菜单不用建文件）
 * - 菜单项写了 permission → 挂到 meta.permission，由守卫统一鉴权
 */
function buildModuleRoutes(): RouteRecordRaw[] {
  return MODULES.map((mod) => ({
    path: mod.path,
    redirect: `${mod.path}/${mod.children[0].path}`,
    children: mod.children.map((item) => {
      const absPath = `${mod.path}/${item.path}`
      const component = item.component ? views[`/src/views/${item.component}`] : undefined
      return {
        path: absPath,
        name: `${mod.key}-${item.path}`,
        component: component || MenuPlaceholder,
        meta: {
          moduleKey: mod.key,
          moduleTitle: mod.title,
          menuTitle: item.title,
          title: item.pageTitle || item.title,
          /** 访问该页所需的权限点；不填 = 登录后即可访问 */
          permission: item.permission,
          /** 该页还需要后端确认的服务端角色（/api/permission），取模块级配置 */
          serverPermission: mod.serverPermission
        },
        // 有真实页面时，把菜单里声明的静态 props 透传给组件（例如警报页的 categoryId）
        props: component ? (item.props ?? undefined) : { title: item.title, desc: `${mod.title} / ${item.title}` }
      } as RouteRecordRaw
    })
  }))
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { public: true, title: '系统登录' }
  },
  {
    // 注册：接口真实存在（/api/userRegister + /api/userUnRegister 校验账号）
    path: '/register',
    name: 'register',
    component: () => import('@/views/login/RegisterView.vue'),
    meta: { public: true, title: '注册账号' }
  },
  {
    // 找回密码：**后端尚未提供接口**，本页为界面预留（页内已明确告知）
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/login/ForgotPasswordView.vue'),
    meta: { public: true, title: '找回密码' }
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '系统监控概览' }
      },
      ...buildModuleRoutes(),
      {
        /**
         * 动态菜单兜底路由
         * ------------------------------------------------------------
         * 菜单改由后端下发后，后端可能返回前端还没实现页面的 path。
         * 这里用占位页接住，保证"点了菜单不会白屏/404"，同时提醒去补页面。
         * 注意：必须放在最后，优先级最低，不会抢已有路由。
         */
        path: ':pathMatch(.*)*',
        name: 'dynamic-menu-fallback',
        component: MenuPlaceholder,
        props: (to: { path: string }) => ({
          title: '页面未实现',
          desc: `动态菜单指向了未注册的路由：${to.path}`
        }),
        meta: { title: '页面未实现' }
      }
    ]
  },
  {
    /**
     * 403 独立落地页（主框架之外）
     * ------------------------------------------------------------
     * 后端 2026-10-21 的要求：「没权限就重定向到一个单独独立落地页，
     * 让其重新登入提权」。所以这里刻意**不放在 Layout 里** ——
     * 没有顶栏、没有侧边栏、没有菜单，整屏就是这一页。
     */
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/error/Forbidden.vue'),
    meta: { public: true, title: '无访问权限' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'CMP3.0 Admin'

/**
 * 全局开关：VITE_USE_AUTH=false 时跳过"登录 + 权限"两层，方便纯看壳子/对设计图。
 * 注意：它只影响前端路由，不改变任何安全边界（前端本来就不承担鉴权）。
 */
const USE_AUTH = import.meta.env.VITE_USE_AUTH !== 'false'

/**
 * 服务端权限查询结果缓存（本会话内有效）
 *
 * 为什么要缓存：
 *   `/api/permission` 是"再问一次后端"，每跳一页都打一次既慢又浪费；
 *   而权限在登录期间不会变（改权限要重新登录才生效），缓存到刷新页面即失效。
 *
 * 为什么失败也缓存：
 *   后端明确拒绝（400/401/403/405）是稳定结论，没必要反复试。
 */
const serverPermCache = new Map<ServerPermission, boolean>()
/** 缓存归属的登录用户 Id：换人登录（或退出后换号）时缓存必须作废 */
let serverPermCacheOwner = ''

async function ensureServerPermission(permission: ServerPermission): Promise<boolean> {
  // 用登录用户 Id 做缓存归属标记，避免 A 退出、B 登录后还复用 A 的结论
  const owner = String(useUserStore().userInfo?.userId ?? '')
  if (owner !== serverPermCacheOwner) {
    serverPermCache.clear()
    serverPermCacheOwner = owner
  }
  const cached = serverPermCache.get(permission)
  if (cached !== undefined) return cached

  const verdict = await checkPermissionApi(permission)

  // 后端没给出可判读的结论（302 跳它自己的登录页 / 空响应 / 连不上）：
  // 不能当成"你没权限"，否则后端一没实现好，管理员也进不去。
  // 也不缓存 —— 后端修好后刷新页面就能自动恢复成真判定。
  if (verdict === 'unknown') {
    // eslint-disable-next-line no-console
    console.warn(
      `[permission] /api/permission 未给出明确结论（可能后端仍在查 Session 而非 Authorization 头），` +
        `本次按「不阻断」放行：${permission}`
    )
    return true
  }

  const granted = verdict === 'granted'
  serverPermCache.set(permission, granted)
  return granted
}

/**
 * ============================================================
 * 全局路由守卫 —— 职责分三层，别再把它们混在一起
 * ============================================================
 *   ① 认证 Authentication：有没有登录（有没有有效 token）
 *        → 没登录 → 踢到 /login，并记住原本要去的地址
 *
 *   ② 身份 Identity：当前用户是谁（角色/权限点）
 *        → 刷新页面后 store 是空的，这里负责把用户信息补回来
 *        → 拉取失败（后端没起来/网络问题）不阻断导航，否则会整站白屏
 *
 *   ③ 授权 Authorization：这个身份能不能进这个页面
 *        → 页面在 meta.permission 里声明所需权限点
 *        → 不满足 → 跳 /403（而不是跳 /login：用户是登录着的，只是没权限）
 *
 * 待明确（后端接口就绪后要定的）：
 *   - 权限点是后端下发还是前端维护（现见 config/permission.ts 的说明）
 *   - token 过期时间 / 是否需要静默续期
 *   - 是否要做"动态菜单"：由后端返回菜单树，前端不再用 config/menu.ts 静态配置
 */
router.beforeEach(async (to) => {
  // 浏览器标题：任何情况下都先设，避免停在旧标题
  document.title = to.meta?.title ? `${to.meta.title} - ${APP_TITLE}` : APP_TITLE

  // 免登录白名单（登录页 / 403 / 404）或整体关闭鉴权 → 直接放行
  if (!USE_AUTH || to.meta?.public) return true

  const userStore = useUserStore()

  // ---------- ① 认证 ----------
  // 说明：这里读的是 store（初始化时已从 localStorage 恢复），不再直接读 localStorage
  if (!userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // ---------- ② 身份 ----------
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      // 拉不到用户信息时不阻断：让它进页面，接口层遇到 401 会自己清理并跳登录
    }
  }

  // ---------- ③ 授权 ----------
  if (!userStore.hasPermission(to.meta?.permission as string | string[] | undefined)) {
    // 注意跳的是独立落地页 /403，而不是登录页：用户是登录着的，只是没这个权限
    return { path: '/403' }
  }

  // ---------- ③-b 服务端授权（再问一次后端） ----------
  // 前端权限点能改 JS 绕过，这里的结果来自后端 `/api/permission`。
  // 每次会话只问一次（结果缓存在内存里），不会每跳一页就打一次接口。
  const serverPermission = to.meta?.serverPermission as ServerPermission | undefined
  if (serverPermission && !(await ensureServerPermission(serverPermission))) {
    return { path: '/403' }
  }

  // ---------- 菜单（数据层，放在授权之后） ----------
  // 静态模式：本地按权限算一遍；动态模式：拉后端菜单树。
  // 幂等且失败会自动回退静态配置，所以这里 await 是安全的（不会因为接口挂了进不去页面）。
  await useMenuStore().loadMenus()

  return true
})

/**
 * 兜底：动态 import 失败（发版后旧 chunk 失效）时刷新一次，避免白屏。
 *
 * 注意这里存的是**时间戳**而不是路径：只存路径的话，一旦刷新后导航仍然失败
 * （afterEach 没跑到），标记就永远清不掉，之后每次进站都直接白屏、再也恢复不了。
 * 加个有效期，过期的标记视为无效，保证最坏情况也只是「多刷几次」而不是「永久白屏」。
 */
const CHUNK_RETRY_KEY = 'cmp-admin:chunk-retried'
const CHUNK_RETRY_TTL = 15_000

router.onError((error) => {
  const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    error.message
  )
  if (!isChunkError) return

  const last = Number(sessionStorage.getItem(CHUNK_RETRY_KEY) || 0)
  const fresh = last > 0 && Date.now() - last < CHUNK_RETRY_TTL
  if (fresh) return

  sessionStorage.setItem(CHUNK_RETRY_KEY, String(Date.now()))
  window.location.reload()
})

/** 导航成功就清掉标记，避免下次真的出错时被跳过 */
router.afterEach(() => {
  if (sessionStorage.getItem(CHUNK_RETRY_KEY)) {
    sessionStorage.removeItem(CHUNK_RETRY_KEY)
  }
})

export default router
