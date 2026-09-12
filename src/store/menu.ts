/**
 * 菜单状态（动态菜单的核心扩展点）
 * ============================================================
 * 菜单源只有一个开关：`.env.*` 里的 `VITE_MENU_SOURCE`
 *   - `static`（默认）：读 `config/menu.ts` 的静态配置
 *   - `remote`        ：调 `api/menu.ts` 拿后端下发的菜单树（失败自动回退静态）
 *   - `auto`          ：先用缓存，再尝试接口，失败回退静态（推荐上线后用它）
 *
 * 换源时**不需要动渲染层**：两条路都会经过 `config/menuTree.ts` 归一化成 MenuNode 树，
 * 再由本 store 做权限过滤，最后交给 `layout/MenuTree.vue` 递归渲染。
 *
 * 权限过滤放在 store（而不是布局里）的原因：
 *   菜单可见性属于"授权"关注点，和守卫同源；布局只负责画。
 *   这样以后要加"按角色不同的菜单顺序/分组"也只改这里。
 */
import { defineStore } from 'pinia'
import { checkPermission } from '@/config/permission'
import { buildStaticMenus, normalizeRemoteMenus, type RemoteMenuNode } from '@/config/menuTree'
import type { MenuNode } from '@/config/menuTypes'
import { fetchRemoteMenus, MENU_SOURCE } from '@/api/menu'
import { useUserStore } from './user'

interface MenuState {
  /** 归一化后的**未过滤**菜单树（排查问题时有用，也能给"权限配置页"复用） */
  rawMenus: MenuNode[]
  /** 已经过权限过滤的树（渲染用这个） */
  menus: MenuNode[]
  loading: boolean
  /** 实际生效的来源，用于调试/展示 */
  source: 'static' | 'remote'
  /** 是否已加载（防止重复请求） */
  loaded: boolean
}

/**
 * 递归做权限过滤。
 * 之所以不直接用 `menuTypes.ts` 里的 filterMenuByPermission：
 * 这里需要绑定 store 的 hasPermission，且要保持响应式依赖（读 userStore.permissions），
 * 所以用一个 getter 包一层。
 */
function filterTree(nodes: MenuNode[], has: (p?: string | string[]) => boolean): MenuNode[] {
  const out: MenuNode[] = []
  for (const node of nodes) {
    const children = node.children?.length ? filterTree(node.children, has) : undefined
    if (node.children?.length) {
      if (!children?.length) continue
      if (node.permission && !has(node.permission)) continue
      out.push({ ...node, children })
      continue
    }
    if (has(node.permission)) out.push({ ...node })
  }
  return out
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    rawMenus: [],
    menus: [],
    loading: false,
    source: MENU_SOURCE === 'remote' ? 'remote' : 'static',
    loaded: false
  }),

  getters: {
    /** 顶部大 Tab（= 树的顶层节点，已经有权限过滤） */
    modules: (state): MenuNode[] => state.menus,

    /** 当前是否走动态菜单，界面上可以据此显示"调试"提示 */
    isDynamic: (state) => state.source === 'remote'
  },

  actions: {
    /**
     * 应用（或刷新）菜单
     * @param nodes 归一化后的菜单树
     * @param source 来源标记
     */
    applyMenus(nodes: MenuNode[], source: 'static' | 'remote') {
      this.rawMenus = nodes
      this.source = source
      this.loaded = true
      this.refreshByPermission()
    },

    /** 按当前用户的权限重新过滤（角色/权限变化后调用） */
    refreshByPermission() {
      const has = (p?: string | string[]) => checkPermission(useUserStore().permissions, p)
      this.menus = filterTree(this.rawMenus, has)
    },

    /**
     * 加载菜单（幂等：已加载过就直接返回，除非 force）
     * 调用时机：路由守卫（首次进入受保护路由）、布局挂载、权限变更后。
     */
    async loadMenus(force = false) {
      if (this.loaded && !force) return this.menus
      this.loading = true
      try {
        if (MENU_SOURCE === 'static') {
          this.applyMenus(buildStaticMenus(), 'static')
          return this.menus
        }

        // remote / auto：先试接口
        const remote = await fetchRemoteMenus()
        if (remote?.length) {
          this.applyMenus(normalizeRemoteMenus(remote as RemoteMenuNode[]), 'remote')
        } else {
          // 接口没给数据（或后端还没实现）→ 回退静态配置，保证界面不是空的
          this.applyMenus(buildStaticMenus(), 'static')
        }
        return this.menus
      } catch {
        // 网络异常同样回退，避免整站没菜单可用
        this.applyMenus(buildStaticMenus(), 'static')
        return this.menus
      } finally {
        this.loading = false
      }
    },

    /** 退出登录 / 切换用户时清空，下次进入会重新加载 */
    reset() {
      this.rawMenus = []
      this.menus = []
      this.loaded = false
      this.loading = false
      this.source = MENU_SOURCE === 'remote' ? 'remote' : 'static'
    }
  }
})
