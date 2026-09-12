/**
 * 许可作业（Permitted to Work）接口
 * ------------------------------------------------------------
 * ⚠️ 待后端确认的筛选项与字段：
 *   - 查询条件：当前是 工作票编号 / 许可类型 / 许可申请人 / 申请日期范围（按截图做）
 *   - "许可批准申请"这个下拉的选项来源（字典接口？）现在写死在 mock 里
 *   - 导出是后端生成文件还是前端导出（当前只占位）
 */
import { request } from './request'
import { USE_MOCK, mockExportPermitWork, mockGetPermitWorkPage, permitWorkOptions } from '@/mock'
import type { PermitWorkQuery, PermitWorkRow } from '@/mock'
import type { PageResult } from '@/types/api'

/** 分页查询许可作业列表：GET /permit-work/page */
export async function getPermitWorkPageApi(
  params: PermitWorkQuery
): Promise<PageResult<PermitWorkRow>> {
  if (USE_MOCK) return mockGetPermitWorkPage(params)
  const { data } = await request<PageResult<PermitWorkRow>>({
    url: '/permit-work/page',
    method: 'get',
    params
  })
  return data
}

/**
 * 导出：GET /permit-work/export
 * ⚠️ 注意：真实导出要用 `responseType: 'blob'` 单独处理，不能复用 request 的拆包逻辑
 *    （见 api/request.ts 顶部的 To-Do）
 */
export async function exportPermitWorkApi(params: PermitWorkQuery): Promise<void> {
  if (USE_MOCK) {
    await mockExportPermitWork()
    return
  }
  await request({ url: '/permit-work/export', method: 'get', params })
}

/**
 * 下拉选项（区域 / 许可类型 / 公司）
 * 现在是常量；后端就绪后应换成字典接口，并按需缓存。
 */
export function getPermitWorkOptions() {
  return permitWorkOptions
}
