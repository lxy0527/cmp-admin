/**
 * 角色管理 —— 假数据
 * ------------------------------------------------------------
 * DB 里的 6 条是按截图抄的；增删改直接作用在这个内存数组上，
 * 所以页面上的"新增/编辑/删除"是真能生效的（刷新页面还原）。
 *
 * ⚠️ 待后端确认：角色字段是否还有 状态 / 排序 / 关联权限点；
 *    "角色描述"是否与"角色名称"同值（截图里 6 条全都一样，像是没单独填）。
 */
import type { PageQuery, PageResult } from '@/types/api'
import { delay } from './helper'

export interface RoleRow {
  id: number
  roleName: string
  roleDesc: string
  createTime: string
}

export interface RoleQuery extends PageQuery {
  roleName?: string
}

/** 截图里的 6 条角色数据 */
const DB: RoleRow[] = [
  { id: 8, roleName: 'KCCM_Data', roleDesc: 'KCCM_Data', createTime: '2026-08-03 23:12' },
  { id: 7, roleName: 'ABLE_Viewer', roleDesc: 'ABLE_Viewer', createTime: '2026-08-15 22:42' },
  { id: 6, roleName: 'ABLE_Mgt', roleDesc: 'ABLE_Mgt', createTime: '2026-08-15 22:40' },
  { id: 5, roleName: '管理員_Mgt', roleDesc: '管理員_Mgt', createTime: '2026-01-06 11:11' },
  { id: 4, roleName: '觀察者_Viewer', roleDesc: '觀察者_Viewer', createTime: '2026-01-06 10:37' },
  { id: 1, roleName: '超級管理員', roleDesc: '超級管理員', createTime: '2025-12-21 11:52' }
]

let nextId = 9

/** 分页查询（假实现）：按角色名模糊匹配 */
export async function mockGetRolePage(params: RoleQuery): Promise<PageResult<RoleRow>> {
  await delay()
  const rows = params.roleName
    ? DB.filter((r) => r.roleName.includes(params.roleName as string))
    : [...DB]
  const start = (params.pageNum - 1) * params.pageSize
  return {
    list: rows.slice(start, start + params.pageSize),
    total: rows.length,
    pageNum: params.pageNum,
    pageSize: params.pageSize
  }
}

/**
 * 新增 / 编辑（假实现）
 * 带 id → 就地改内存里的那条；不带 id → 生成新记录插到最前面。
 */
export async function mockSaveRole(data: Partial<RoleRow>): Promise<RoleRow> {
  await delay()
  if (data.id) {
    const target = DB.find((r) => r.id === data.id)
    if (target) Object.assign(target, data)
    return target as RoleRow
  }
  const row: RoleRow = {
    id: nextId++,
    roleName: data.roleName || '',
    roleDesc: data.roleDesc || data.roleName || '',
    createTime: formatNow()
  }
  DB.unshift(row)
  return row
}

/** 删除（假实现）：真删内存数组里的记录 */
export async function mockDeleteRole(id: number) {
  await delay()
  const idx = DB.findIndex((r) => r.id === id)
  if (idx > -1) DB.splice(idx, 1)
  return true
}

/** 当前时间，格式与列表里其它记录的 createTime 保持一致 */
function formatNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
