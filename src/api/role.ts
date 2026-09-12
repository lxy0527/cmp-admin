/**
 * 角色管理接口
 * ------------------------------------------------------------
 * ⚠️ 待后端确认：角色是否还有"状态/排序/关联权限点"等字段，
 *    以及权限点是由角色接口返回还是单独接口。当前只按截图上看到的 4 列建模。
 */
import { request } from './request'
import { USE_MOCK, mockDeleteRole, mockGetRolePage, mockSaveRole } from '@/mock'
import type { RoleQuery, RoleRow } from '@/mock'
import type { PageResult } from '@/types/api'

/** 分页查询角色：GET /role/page */
export async function getRolePageApi(params: RoleQuery): Promise<PageResult<RoleRow>> {
  if (USE_MOCK) return mockGetRolePage(params)
  const { data } = await request<PageResult<RoleRow>>({ url: '/role/page', method: 'get', params })
  return data
}

/** 新增 / 编辑角色：POST /role/save（带 id = 编辑） */
export async function saveRoleApi(data: Partial<RoleRow>): Promise<RoleRow> {
  if (USE_MOCK) return mockSaveRole(data)
  const res = await request<RoleRow>({ url: '/role/save', method: 'post', data })
  return res.data
}

/** 删除角色：DELETE /role/{id} */
export async function deleteRoleApi(id: number): Promise<void> {
  if (USE_MOCK) {
    await mockDeleteRole(id)
    return
  }
  await request({ url: `/role/${id}`, method: 'delete' })
}
