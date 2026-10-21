/**
 * 首页看板
 * ------------------------------------------------------------
 * ⚠️ **后端没有看板接口**（40 个接口全量核对过，没有任何 dashboard 相关接口）。
 *
 * 所以这里**永远走内置数据**，不再发请求。
 * 之前真实模式下会去请求不存在的 `/dashboard/overview`：
 * 登录后立刻弹一条 `Request failed with status code 404`，用户会误以为是登录出错 —— 纯噪音。
 *
 * 待定（已记入《后端待办清单》）：那 4 个统计卡到底统计什么、口径如何。
 * 后端给了接口后，把 `getDashboardApi` 的实现换成 `getDashboardApiReal` 即可，页面不用动。
 */
import { request } from './request'
import { mockGetDashboard } from '@/mock'
import type { DashboardData } from '@/mock'

/** 首页看板数据（当前固定为内置数据，见文件头说明） */
export async function getDashboardApi(): Promise<DashboardData> {
  return mockGetDashboard()
}

/**
 * 预留给后端的真实实现 —— 接口一旦提供，把 `getDashboardApi` 改成调这个。
 * 保留代码是为了让"接真实数据"只改一行，不用回忆当时该写成什么样。
 */
export async function getDashboardApiReal(): Promise<DashboardData> {
  const { data } = await request<DashboardData>({ url: '/dashboard/overview', method: 'get' })
  return data
}
