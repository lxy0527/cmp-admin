/**
 * 菜单配置（静态源）
 * ============================================================
 * 这个文件同时是**路由表的数据源**和**静态菜单树的数据源**：
 *   - 路由：`router/index.ts` 读 MODULES 生成路由（页面组件在这里绑定）
 *   - 菜单：`config/menuTree.ts` 把 MODULES 归一化成 MenuNode 树给左侧菜单渲染
 *
 * ★ 菜单名一律写 `titleKey`（i18n key），`title` 只作兜底。
 *   切换语言时菜单会跟着变，不需要重载页面。
 *
 * ★ 命名已按旧站（CMP2.0）校正（2026-10-15）：
 *   CMP Setting 旧站 6 项，后端优化掉「組織結構管理」后为 **5 项**。
 *   注意「照片牆檔案管理 / 照片牆資源管理」管的是**照片墙的档案与资源（图片/视频）**，
 *   **不是报警** —— 之前配置里写的「报警信息管理 / 图片报警管理」是从模糊截图猜的，已废弃。
 *
 * ★ Data Receiving 的 9 项中：
 *   - Permit to Work、Digitized Tracking → **后端尚无接口**（后端文档问题 2 已确认）
 *   - 其余 7 项 → **共用同一个警报列表组件**，靠 `categoryId` 区分
 *     分类 Id 以**接口为准**（公开 API 文档的 CategoryId，1~7），
 *     不是旧站后台的 `4scategory_type`（1~9 且顺序不同）。
 */
import { P, type PermissionCode } from './permission'

export interface MenuItem {
  /** 兜底显示名（i18n 缺失时用） */
  title: string
  /** i18n key，优先于 title */
  titleKey?: string
  /**
   * 路由 path 片段（拼在模块 path 之后），同时作为视图 key。
   * 分组节点（只做展开收起、不跳转）也必须有 path，作为 key 用。
   */
  path: string
  /** 有独立页面时填相对 `src/views` 的组件路径；不填 = 走统一占位页 */
  component?: string
  /** 传给页面组件的静态 props（例如警报页的分类 Id） */
  props?: Record<string, unknown>
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
  /** 顶部大 Tab 显示名（兜底） */
  title: string
  /** i18n key，优先于 title */
  titleKey?: string
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

/**
 * 警报类页面的分类 Id —— **以接口为准**
 * 来源：公开 API 文档 `apidoc.webaisys.cn` 的 CategoryId 定义（值 1~7）。
 * ⚠️ 与旧站后台的 `4scategory_type`（1~9，顺序也不同）不是一套，别混用。
 */
const ALARM_CATEGORY = {
  /** 智能锁安全管控系统 */
  eLock: 1,
  /** 移动机械安全管控系统 */
  mobilePlant: 2,
  /** 起重机（吊机/塔吊/天秤）安全管控系统 */
  craneLifting: 3,
  /** 一线作业智能监控系统 */
  frontline: 4,
  /** AI智能监控系统 */
  ai: 5,
  /** 密闭空间安全监测系统 */
  confinedSpace: 6,
  /** 虚拟培训系统 */
  vrTraining: 7
} as const

/** 7 个警报页共用的组件路径 */
const ALARM_PAGE = 'dataReceiving/AlarmList.vue'

/** 顶部大 Tab + 各自的左侧菜单 */
export const MODULES: ModuleConfig[] = [
  {
    key: 'data-receiving',
    title: 'Data Receiving',
    titleKey: 'menu.dataReceiving',
    path: '/data-receiving',
    icon: 'data',
    children: [
      {
        title: 'Permit to Work',
        titleKey: 'menu.dataReceivingItems.permitToWork',
        path: 'permit-to-work',
        // ⚠️ 后端尚无此模块接口（其文档问题 2 已确认），本页数据仍走 mock
        component: 'dataReceiving/PermittedToWork.vue',
        permission: P.dataReceivingView
      },
      {
        title: 'Digitized Tracking',
        titleKey: 'menu.dataReceivingItems.digitizedTracking',
        path: 'digitized-tracking',
        // ⚠️ 同上：接口与字段均未提供，先走占位页
        permission: P.dataReceivingView
      },
      {
        title: 'E-Lock and Key Sys',
        titleKey: 'menu.dataReceivingItems.eLockAndKeySys',
        path: 'e-lock-and-key-sys',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.eLock },
        permission: P.dataReceivingView
      },
      {
        title: 'Unsafe acts Mobile Plant',
        titleKey: 'menu.dataReceivingItems.unsafeActsMobilePlant',
        path: 'unsafe-acts-mobile-plant',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.mobilePlant },
        permission: P.dataReceivingView
      },
      {
        title: 'Unsafe acts Crane Lifting',
        titleKey: 'menu.dataReceivingItems.unsafeActsCraneLifting',
        path: 'unsafe-acts-crane-lifting',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.craneLifting },
        permission: P.dataReceivingView
      },
      {
        title: 'Smart Monitoring for Frontline',
        titleKey: 'menu.dataReceivingItems.smartMonitoringForFrontline',
        path: 'smart-monitoring-for-frontline',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.frontline },
        permission: P.dataReceivingView
      },
      {
        title: 'Safety Monitoring Sys Using AI',
        titleKey: 'menu.dataReceivingItems.safetyMonitoringSysUsingAI',
        path: 'safety-monitoring-sys-using-ai',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.ai },
        permission: P.dataReceivingView
      },
      {
        title: 'Confined Space Monitoring',
        titleKey: 'menu.dataReceivingItems.confinedSpaceMonitoring',
        path: 'confined-space-monitoring',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.confinedSpace },
        permission: P.dataReceivingView
      },
      {
        title: 'VR Training',
        titleKey: 'menu.dataReceivingItems.vrTraining',
        path: 'vr-training',
        component: ALARM_PAGE,
        props: { categoryId: ALARM_CATEGORY.vrTraining },
        permission: P.dataReceivingView
      }
    ]
  },
  {
    key: 'cmp-setting',
    title: 'CMP Setting',
    titleKey: 'menu.cmpSetting',
    path: '/cmp-setting',
    icon: 'setting',
    children: [
      {
        title: '角色管理',
        titleKey: 'menu.cmpSettingItems.role',
        path: 'roles',
        component: 'cmpSetting/RoleManagement.vue',
        // 整页需要查询权限；没有该权限的角色连菜单和模块 Tab 都看不到
        permission: P.roleQuery
      },
      {
        title: '帳號管理',
        titleKey: 'menu.cmpSettingItems.accountManagement',
        path: 'accounts',
        component: 'cmpSetting/AccountManagement.vue',
        permission: P.userQuery
      },
      {
        title: '客戶管理',
        titleKey: 'menu.cmpSettingItems.customerManagement',
        path: 'customers',
        component: 'cmpSetting/CustomerManagement.vue',
        permission: P.customerQuery
      },
      {
        title: '照片牆檔案管理',
        titleKey: 'menu.cmpSettingItems.photoWall',
        path: 'photo-wall',
        component: 'cmpSetting/PhotoWall.vue',
        permission: P.photoWall
      },
      {
        title: '照片牆資源管理',
        titleKey: 'menu.cmpSettingItems.photoContent',
        path: 'photo-content',
        component: 'cmpSetting/PhotoContent.vue',
        permission: P.photoContent
      },
      {
        title: '推送地址',
        titleKey: 'menu.cmpSettingItems.pushAddress',
        path: 'push-address',
        component: 'cmpSetting/PushAddress.vue',
        permission: P.pushAddress
      }
    ]
  }
]

/** 按 key 取模块配置 */
export function getModuleByKey(key: string) {
  return MODULES.find((m) => m.key === key)
}
