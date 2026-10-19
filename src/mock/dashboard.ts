/**
 * 首页看板 —— 假数据
 * ------------------------------------------------------------
 * ⚠️ 两处待确认（都别照抄我猜的）：
 *   1. cards 的 4 个指标名与口径：截图上是"離線設備 / 未處理報警 / 在線人員 / 在建工地"，值全是 0；
 *   2. monitor 的分布维度：截图只有一个灰色空环 + "系统监控概览"标题，没有图例。
 *      我按"设备在线率"编了一组数让环形图不空，接口就绪后换成真实字段。
 *
 * ★ 为什么这里是**有状态**的（而不是每次返回同一份常量）：
 *   文档对 WebSocket 的描述是——"推送数据只推几个关键字段，然后前端用 http 请求查询最新内容"。
 *   所以正确链路是：WS 推一条 → 前端**再发一次 HTTP** 拿最新统计。
 *   为了能真实地演示这条链路，这份 mock 必须在"收到推送"之后数字能变，
 *   否则 HTTP 刷新回来永远是同一份数据，看起来就像没生效。
 *   → 演示模式下由 `bumpAlarm()` 模拟"后端已经把这条警报存进库了"。
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

/**
 * 可变状态：模拟"后端数据库里的统计值"。
 * 只有演示模式会去动它（见 bumpAlarm），真实环境这些数字由后端接口返回。
 */
const state = {
  /** 未處理報警 */
  unprocessedAlarm: 0,
  /** 告警设备（环形图图例第三项） */
  alertDevices: 12
}

/**
 * 演示用：模拟"后端收到了一条新警报"。
 * 调用之后，下一次 mockGetDashboard() 返回的数字会变大 —— 这正是
 * "WS 推送 → HTTP 重新拉取" 这条链路的可见效果。
 */
export function bumpAlarm() {
  state.unprocessedAlarm += 1
  state.alertDevices += 1
}

/** 首页看板（假实现，但数字会随 bumpAlarm() 变化） */
export async function mockGetDashboard(): Promise<DashboardData> {
  await delay()
  return {
    cards: [
      { key: 'offline', label: '离线設備', value: 0, color: '#3d8bfd' },
      { key: 'alarm', label: '未處理報警', value: state.unprocessedAlarm, color: '#f5a623' },
      { key: 'online', label: '在線人員', value: 0, color: '#3d8bfd' },
      { key: 'site', label: '在建工地', value: 0, color: '#9254de' }
    ],
    monitor: [
      { name: '在线设备', value: 128, color: '#3d8bfd' },
      { name: '离线设备', value: 32, color: '#f5a623' },
      { name: '告警设备', value: state.alertDevices, color: '#ef4444' }
    ],
    onlineRate: 78
  }
}
