import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { MODULES } from '@/config/menu'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'
import { checkPermission } from '@/config/permission'

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
          permission: item.permission
        },
        props: component ? undefined : { title: item.title, desc: `${mod.title} / ${item.title}` }
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
        // 无权限页放在主框架内：顶栏和菜单还在，用户可以自己点回有权限的模块
        path: 'forbidden',
        name: 'forbidden',
        component: () => import('@/views/error/Forbidden.vue'),
        meta: { public: true, title: '无访问权限' }
      },
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
    // 顶层兜底：万一有布局外的跳转也能落到同一页面
    path: '/403',
    name: 'forbidden-standalone',
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
    // 注意跳的是主框架内的 /forbidden，而不是登录页：用户是登录着的，只是没这个权限
    return { path: '/forbidden' }
  }

  // ---------- 菜单（数据层，放在授权之后） ----------
  // 静态模式：本地按权限算一遍；动态模式：拉后端菜单树。
  // 幂等且失败会自动回退静态配置，所以这里 await 是安全的（不会因为接口挂了进不去页面）。
  await useMenuStore().loadMenus()

  return true
})

/** 兜底：动态 import 失败（发版后旧 chunk 失效）时刷新一次，避免白屏 */
router.onError((error, to) => {
  const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    error.message
  )
  if (isChunkError && !sessionStorage.getItem('cmp-admin:chunk-retried')) {
    sessionStorage.setItem('cmp-admin:chunk-retried', String(to.fullPath))
    window.location.reload()
  }
})

/** 用完就清掉重试标记，避免下次真的出错时被跳过 */
router.afterEach(() => {
  if (sessionStorage.getItem('cmp-admin:chunk-retried')) {
    sessionStorage.removeItem('cmp-admin:chunk-retried')
  }
})

export default router
