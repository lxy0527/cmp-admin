/**
 * 推送地址（接收端）配置
 * ============================================================
 * 这些是**第三方系统往 CMP 推数据**的入口地址，不是前端调用的接口。
 * 页面作用：把地址列出来给对接方看 + 内嵌官方文档。
 *
 * ⚠️ 数据来源说明（重要，别当成"接口坏了"）：
 *   旧站这份清单来自 `/cmp/common/receiving-apis`，但那是**旧站后台接口**（走 JWT + org_id），
 *   新后端（192.168.77.15:82）上**没有这个路径，实测 404**。
 *   所以这里先用**静态配置**（内容是从旧站实际抓下来的，8 条都在），
 *   等后端给新接口时只需要把 getReceivingApis() 的实现换掉，页面不用动。
 *
 * ⚠️ 文档来源：
 *   旧网的《CMP 开放数据接收 API 接口文档 v1.6.0》需要登录旧站才能看；
 *   目前公开可访问的是 apidoc.webaisys.cn 的 cmpApiOpen 文档（通用说明 + 通用警报推送）。
 *   所以下面 DOC_PAGES 里嵌的是**公开文档**，完整版需后端提供。
 */

/** 文档站根地址（公开可访问，允许被 iframe 内嵌 —— 已实测无 X-Frame-Options / CSP） */
export const DOC_BASE = 'http://apidoc.webaisys.cn'

/** 可内嵌的文档页 */
export const DOC_PAGES = [
  { key: 'common', path: '/cmpApiOpen/index.html' },
  { key: 'alarm', path: '/cmpApiOpen/alarmAdd.html' }
] as const

export type PushKind = 'alarm' | 'config' | 'stat'

export interface PushEndpoint {
  /** 稳定的 key（列表用） */
  key: string
  /** 系统名称（多数是英文品牌名，不翻译） */
  system: string
  /** 接口用途类别，决定后缀文案（走 i18n） */
  kind: PushKind
  /** 请求方法 */
  method: 'POST'
  /** 接口路径（拼在 BASE 后面） */
  path: string
}

/**
 * 8 条推送地址 —— 内容与旧站「推送地址」页一致
 * （旧站是动态从接口拉的，这里改成静态配置，原因见文件头）
 */
export const PUSH_ENDPOINTS: PushEndpoint[] = [
  {
    key: 'elock',
    system: 'E-Lock and Key Sys.',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/elock-alert-receiving'
  },
  {
    key: 'mobile-plant',
    system: 'Mobile Plant Danger Zone',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/unsafe-acts-alert-receiving'
  },
  {
    key: 'frontline',
    system: 'Frontline Monitoring',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/smart_monitoring_frontline'
  },
  {
    key: 'safety-ai',
    system: 'AI Monitoring',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/safety_monitoring_sys_using_ai'
  },
  {
    key: 'confined-space',
    system: 'Confined Space Monitoring',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/confined_space_monitoring'
  },
  {
    key: 'vr-training',
    system: 'VR Training',
    kind: 'alarm',
    method: 'POST',
    path: '/open/cmp-application/vrTraining'
  },
  {
    key: 'sys-config',
    system: '',
    kind: 'config',
    method: 'POST',
    path: '/open/cmp-application/sys_config_receiving'
  },
  {
    key: 'rectangle-stat',
    system: '',
    kind: 'stat',
    method: 'POST',
    path: '/open/cmp-application/rectangle-stat'
  }
]
