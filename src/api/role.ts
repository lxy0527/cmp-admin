/**
 * 角色管理接口
 * ------------------------------------------------------------
 * ⚠️ 后端**没有角色接口**（48 页文档里没有 role / 权限点相关接口），
 *    所以这里**永远返回 mock 数据，不看 VITE_USE_MOCK**。
 *
 *    为什么改成"永远 mock"（2026-10-22）：
 *    之前是 `if (USE_MOCK) return mock`，把 VITE_USE_MOCK 关掉去连真实后端时，
 *    这页会去打不存在的 `/role/page` → 控制台一片 404。
 *    按最初定的原则「有接口的接真实，无接口的走 mock」，这类模块不受全局开关影响。
 *
 * ⚠️ 待后端确认：角色是否还有"状态/排序/关联权限点"等字段，
 *    以及权限点是由角色接口返回还是单独接口。当前只按截图上看到的 4 列建模。
 */
import { mockDeleteRole, mockGetRolePage, mockSaveRole } from '@/mock'
import type { RoleQuery, RoleRow } from '@/mock'
import type { PageResult } from '@/types/api'

/** 分页查询角色（后端无接口，固定走 mock） */
export async function getRolePageApi(params: RoleQuery): Promise<PageResult<RoleRow>> {
  return mockGetRolePage(params)
}

/** 新增 / 编辑角色（后端无接口，固定走 mock；带 id = 编辑） */
export async function saveRoleApi(data: Partial<RoleRow>): Promise<RoleRow> {
  return mockSaveRole(data)
}

/** 删除角色（后端无接口，固定走 mock） */
export async function deleteRoleApi(id: number): Promise<void> {
  await mockDeleteRole(id)
}
