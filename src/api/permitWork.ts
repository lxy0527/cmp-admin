/**
 * 许可作业（Permitted to Work）接口
 * ------------------------------------------------------------
 * ⚠️ 整页后端尚未提供接口（后端文档 48 页、旧站 52 个页面分包均已核实，无此接口），
 *    所以这里**永远返回 mock 数据，不看 VITE_USE_MOCK**。
 *
 *    为什么改成"永远 mock"（2026-10-22）：
 *    之前是 `if (USE_MOCK) return mock`，一旦把 VITE_USE_MOCK 关掉去连真实后端
 *    （例如给后端同事开局域网地址联调），这页就会去打不存在的 `/permit-work/page`
 *    → 控制台一片 404。按最初定的原则「有接口的接真实，无接口的走 mock」，
 *    这类模块就不该受全局开关影响。等后端真给了接口，把 mock 那行换成 request 即可。
 *
 * 关于「导出」：**这个功能不存在**，不要再补回来
 *   - 后端文档 48 页逐页搜 `导出|export|xlsx|csv|下载|文件流` → 0 命中
 *   - 旧站 52 个页面分包搜同样关键词 → 0 命中（只有 vxe-table 库自身带导出能力，没被调用）
 *   - 旧站页面现场也没有「導出」按钮
 *   - 所以早先那个 `/permit-work/export` 是凭"同类系统一般都有"臆想的路径，已删除
 *
 * ⚠️ 待后端确认的筛选项与字段：
 *   - 查询条件：当前是 工作票编号 / 许可类型 / 许可申请人 / 申请日期范围（按截图做）
 *   - "许可批准申请"这个下拉的选项来源（字典接口？）现在写死在 mock 里
 */
import { mockGetPermitWorkPage, permitWorkOptions } from '@/mock'
import type { PermitWorkQuery, PermitWorkRow } from '@/mock'
import type { PageResult } from '@/types/api'

/** 分页查询许可作业列表（后端无接口，固定走 mock） */
export async function getPermitWorkPageApi(
  params: PermitWorkQuery
): Promise<PageResult<PermitWorkRow>> {
  return mockGetPermitWorkPage(params)
}

/**
 * 下拉选项（区域 / 许可类型 / 公司）
 * 现在是常量；后端就绪后应换成字典接口，并按需缓存。
 */
export function getPermitWorkOptions() {
  return permitWorkOptions
}
