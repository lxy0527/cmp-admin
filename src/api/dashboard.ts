/**
 * 首页看板接口
 * ------------------------------------------------------------
 * ⚠️ 待确认：首页那 4 个统计卡到底是哪 4 个指标、口径是什么（截图上值都是 0）。
 *    当前只是把环形图的分布做出来让页面不空。
 */
import { request } from './request'
import { USE_MOCK, mockGetDashboard } from '@/mock'
import type { DashboardData } from '@/mock'

/** 首页看板数据：GET /dashboard/overview */
export async function getDashboardApi(): Promise<DashboardData> {
  if (USE_MOCK) return mockGetDashboard()
  const { data } = await request<DashboardData>({ url: '/dashboard/overview', method: 'get' })
  return data
}
