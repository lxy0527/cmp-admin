/**
 * 服务端分页辅助
 * ============================================================
 * 后端（2026-10-20 文档 + 实测确认）的约定：
 *
 *   请求：{ page, pagesize }        ← **page 从 0 开始**，不是 1
 *   响应：{
 *     "code": "SUCCESS",
 *     "page": 0,          ← 当前页（0 起），跟 data 平级
 *     "pagecount": 1,     ← 总页数
 *     "totalcount": 2,    ← 总条数
 *     "data": [ ... ]
 *   }
 *
 * ⚠️ 分页元数据在**返回体顶层**，不在 data 里面 —— 这是最容易踩的坑，
 *    写成 `data.totalcount` 会永远拿到 undefined，然后分页器算出 0 页。
 */
import type { ApiResult } from '@/types/api'
import type { PagedData } from '@/composables/useTableList'

/** 把后端的「顶层带分页元数据」响应转成页面要的 { list, total } */
export function toPaged<T>(res: ApiResult<T[]>): PagedData<T> {
  const list = Array.isArray(res.data) ? res.data : []
  // totalcount 缺失时（个别接口还没加）退回用本次条数，至少不显示 "共 0 条"
  const total = Number(res.totalcount ?? list.length)
  return { list, total: Number.isFinite(total) ? total : list.length }
}

/** 演示模式用：对已经拿到的数组做同样的切页，保证演示站行为一致 */
export function slicePage<T>(rows: T[], page: number, pageSize: number): PagedData<T> {
  const start = (Math.max(1, page) - 1) * pageSize
  return { list: rows.slice(start, start + pageSize), total: rows.length }
}
