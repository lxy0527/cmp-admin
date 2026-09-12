/**
 * 首页看板 —— 假数据
 * ------------------------------------------------------------
 * ⚠️ 两处待确认（都别照抄我猜的）：
 *   1. cards 的 4 个指标名与口径：截图上是"離線設備 / 未處理報警 / 在線人員 / 在建工地"，值全是 0；
 *   2. monitor 的分布维度：截图只有一个灰色空环 + "系统监控概览"标题，没有图例。
 *      我按"设备在线率"编了一组数让环形图不空，接口就绪后换成真实字段。
 */
import { delay } from './helper'

export interface StatCard {
  /** 指标 key，用于前端图标/配色映射 */
  key: string
  label: string
  value: number
  color: string
}

export interface DashboardData {
  cards: StatCard[]
  /** 系统监控概览：设备状态分布 */
  monitor: { name: string; value: number; color: string }[]
  /** 设备在线率 0-100，用于中间环形图 */
  onlineRate: number
}

/** 首页看板（假实现） */
export async function mockGetDashboard(): Promise<DashboardData> {
  await delay()
  return {
    cards: [
      { key: 'offline', label: '离线設備', value: 0, color: '#3d8bfd' },
      { key: 'alarm', label: '未處理報警', value: 0, color: '#f5a623' },
      { key: 'online', label: '在線人員', value: 0, color: '#3d8bfd' },
      { key: 'site', label: '在建工地', value: 0, color: '#9254de' }
    ],
    monitor: [
      { name: '在线设备', value: 128, color: '#3d8bfd' },
      { name: '离线设备', value: 32, color: '#f5a623' },
      { name: '告警设备', value: 12, color: '#ef4444' }
    ],
    onlineRate: 78
  }
}
