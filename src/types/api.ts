/**
 * 后端统一返回结构
 * ------------------------------------------------------------
 * 已按真实接口实测校正（2026-10-15）：
 *
 *   CMP 后端目前存在**三套**返回码约定，前端统一做兼容（见 api/request.ts）：
 *     1. 公开接口（apidoc.webaisys.cn）  code: "SUCCESS" / "FAIL"   ← 字符串
 *     2. 开放接收接口（/open/cmp-application/*）  code: 200
 *     3. 旧站后台接口（/api/cmp/*）       code: 0 = 成功
 *
 *   已与后端确认：新接口最终会统一成一种（具体哪种待定），
 *   在那之前前端用 isApiSuccess() 宽容判断，避免每接一个接口就要改一次。
 *
 *   另外实测确认：**请求与响应都是明文 JSON**，接口文档里写的
 *   "请求和响应 json 数据都要做 Encode 处理" 实际不存在，前端不做任何编解码。
 */

/** 业务状态码：三种约定都可能出现，所以这里不收窄成 number */
export type ApiCode = number | string

export interface ApiResult<T = unknown> {
  code: ApiCode
  data: T
  message?: string
}

/**
 * 分页请求参数（前端分页用）
 * 后端明确**不做分页**，列表接口一次返回全量数组，分页/筛选都在前端做。
 * 所以这个类型只描述"页面自己的查询条件 + 当前页"，不再往接口传 pageNum/pageSize。
 */
export interface PageQuery {
  pageNum: number
  pageSize: number
  /** 各页面自己的筛选字段 */
  [key: string]: unknown
}

/** 前端分页后的结果结构（由 useTableList 组装，业务页面消费） */
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
