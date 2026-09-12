/**
 * 菜单配置（静态源）
 * ============================================================
 * 这个文件同时是**路由表的数据源**和**静态菜单树的数据源**：
 *   - 路由：`router/index.ts` 读 MODULES 生成路由（页面组件在这里绑定）
 *   - 菜单：`config/menuTree.ts` 把 MODULES 归一化成 MenuNode 树给左侧菜单渲染
 *
 * 后续如果菜单改成后端下发（预计会发生），需要改的只有一个地方：
 *   `store/menu.ts` 里的 loadMenus() —— 把静态 MODULES 换成接口返回值。
 *   路由表仍然建议由前端维护（页面组件必须在前端注册），
 *   后端只需返回"哪些菜单可见 + 顺序 + 层级"，两边用 `path` 对齐即可。
 *
 * 新增一个菜单项的最小写法：
 *   { title: '菜单名', path: 'url-段' }                             // 自动用占位页
 *   { title: '菜单名', path: 'url-段', component: 'xx/Yy.vue' }      // 用真实页面
 *   { title: '菜单名', path: 'url-段', permission: P.xxx }           // 需要权限才能进
 *   { title: '分组', path: 'group', children: [...] }                // 二级菜单（已支持）
 *
 * ⚠️ 待确认（截图字太小 / 项数对不上）：
 *   - Data Receiving 菜单你说是 11 项，当前按截图只整理了 9 项
 *   - CMP Setting 的子菜单名（报警信息管理 / 图片报警管理 / 推送地址）为推测命名
 */

import { P, type PermissionCode } from './permission'

export interface MenuItem {
  /** 菜单显示名（同时作为默认的页面标题） */
  title: string
  /**
   * 路由 path 片段（拼在模块 path 之后），同时作为视图 key。
   * 分组节点（只做展开收起、不跳转）也必须有 path，作为 key 用。
   */
  path: string
  /** 有独立页面时填相对 `src/views` 的组件路径；不填 = 走统一占位页 */
  component?: string
  /** 页面内标题，不填则取 title */
  pageTitle?: string
  /** 访问该页所需权限点，不填 = 登录后即可访问 */
  permission?: PermissionCode | PermissionCode[]
  /** 二级菜单（已支持，渲染层是递归的） */
  children?: MenuItem[]

  /* ---------------- 以下为"预留扩展位"，现在静态配置用不到，后端下发时能直接用 ---------------- */
  /** 图标标识（图标名 / 图片地址 / 后端编码），渲染层解析 */
  icon?: string
  /** 排序权重，小的在前 */
  order?: number
  /** 隐藏菜单但保留路由 */
  hidden?: boolean
  /** 外链地址：填了则点击直接打开，不走前端路由 */
  externalLink?: string
  /** 置灰不可点（业务态，不是权限） */
  disabled?: boolean
  /** 角标（例如待处理条数） */
  badge?: string | number
}

export interface ModuleConfig {
  /** 模块 key，同时用作路由 name 前缀 */
  key: string
  /** 顶部大 Tab 显示名 */
  title: string
  /** 模块路由前缀 */
  path: string
  /** 模块内菜单项（支持 children 形成二级菜单） */
  children: MenuItem[]
  /* ---------------- 预留扩展位 ---------------- */
  /** 模块 Tab 图标标识 */
  icon?: string
  /** 模块排序 */
  order?: number
  /** 隐藏整个模块 Tab（例如临时下线） */
  hidden?: boolean
}

/** 顶部大 Tab + 各自的左侧菜单 */
export const MODULES: ModuleConfig[] = [
  {
    key: 'data-receiving',
    title: 'Data Receiving',
    path: '/data-receiving',
    icon: 'data',
    children: [
      {
        title: 'Permitted to Work',
        path: 'permitted-to-work',
        component: 'dataReceiving/PermittedToWork.vue',
        permission: P.dataReceivingView
      },
      { title: 'Digitized Tracking', path: 'digitized-tracking', permission: P.dataReceivingView },
      { title: 'E-Lock and Key Sys', path: 'e-lock-and-key-sys', permission: P.dataReceivingView },
      {
        title: 'Unsafe acts Mobile Plant',
        path: 'unsafe-acts-mobile-plant',
        permission: P.dataReceivingView
      },
      {
        title: 'Unsafe acts Crane Lifting',
        path: 'unsafe-acts-crane-lifting',
        permission: P.dataReceivingView
      },
      {
        title: 'Smart Monitoring for Frontline',
        path: 'smart-monitoring-for-frontline',
        permission: P.dataReceivingView
      },
      {
        title: 'Safety Monitoring Sys Using AI',
        path: 'safety-monitoring-sys-using-ai',
        permission: P.dataReceivingView
      },
      {
        title: 'Confined Space Monitoring',
        path: 'confined-space-monitoring',
        permission: P.dataReceivingView
      },
      { title: 'VR Training', path: 'vr-training', permission: P.dataReceivingView }
    ]
  },
  {
    key: 'cmp-setting',
    title: 'CMP Setting',
    path: '/cmp-setting',
    icon: 'setting',
    children: [
      { title: '用户管理', path: 'users', permission: P.userQuery },
      {
        title: '角色管理',
        path: 'roles',
        component: 'cmpSetting/RoleManagement.vue',
        // 整页需要查询权限；没有该权限的角色连菜单和模块 Tab 都看不到
        permission: P.roleQuery
      },
      { title: '报警信息管理', path: 'alarm-info', permission: P.alarmInfo },
      { title: '图片报警管理', path: 'alarm-image', permission: P.alarmImage },
      { title: '推送地址', path: 'push-address', permission: P.pushAddress }
    ]
  }
]

/** 按 key 取模块配置 */
export function getModuleByKey(key: string) {
  return MODULES.find((m) => m.key === key)
}
