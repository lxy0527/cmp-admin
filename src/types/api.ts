/**
 * 后端统一返回结构
 * ------------------------------------------------------------
 * ⚠️ 待后端确认：真实返回是 `{ code, data, message }` 还是 `{ success, result }` 之类。
 *    定下来后只改这三个类型 + api/request.ts 的响应拦截器即可，业务代码不受影响。
 */
export interface ApiResult<T = unknown> {
  /** 业务状态码：200 = 成功（与 HTTP 状态码分开看） */
  code: number
  data: T
  message: string
}

/** 分页请求参数（统一用 pageNum/pageSize；若后端用 page/size，改这里 + mock 即可） */
export interface PageQuery {
  pageNum: number
  pageSize: number
  /** 各页面自己的筛选字段 */
  [key: string]: unknown
}

/** 分页返回结构 */
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

/**
 * 动态菜单相关的类型在 `config/menuTree.ts` 里（RemoteMenuNode / MenuNode）——
 * 因为菜单形状跟"权限-路由"耦合更紧，放 config 下比放 types 下更好找。
 */
