/**
 * 警报实时推送（WebSocket）
 * ============================================================
 * 文档里的接口：`wss://域名/api/alarmWebSocket`
 *
 * 握手参数（文档要求全部必传）：
 *   ApiId / ApiKey / CustomerSN / Timestamp
 * 帧格式：
 *   客户端心跳  {"Type":"ping","Timestamp":1234567890}
 *   服务端回    {"Type":"pong","Timestamp":1234567890}
 *   服务端推    {"Type":"alarm","code":"SUCCESS","data":{"Id":1,"SN":"1001",...}}
 *   客户端必须回 {"Type":"ack","code":"SUCCESS"}   ← 不回服务端会重复推
 *
 * ⚠️ 三个现实约束（决定了本文件的实现方式）：
 *
 *   1. **ApiKey 不能进浏览器**。所以我们不接受"前端自己拼带 key 的 URL"，
 *      而是要求后端/网关提供一个**已经带好鉴权**的完整 WS 地址，配在
 *      `VITE_WS_URL` 里。为空表示没配置，界面会显示"未配置"而不是假装连着。
 *
 *   2. **演示模式下没有后端**，所以用一个本地模拟器按固定节奏造推送，
 *      让看板"活"起来（数字会跳、会弹通知）。模拟器明确标记为模拟，
 *      界面上显示"模擬推送"，不会冒充真实连接。
 *
 *   3. 心跳超时（文档建议约 5 秒收不到 pong）就主动重连，且重连用
 *      **指数退避**，避免后端挂了把浏览器打爆。
 */
import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'
import { DEMO_MODE } from '@/demo'

/** 服务端推送过来的警报数据（文档里的字段就这几个，其余要再查接口） */
export interface AlarmPushData {
  Id: number
  SN: string
  CategoryId?: number
  CustomerId?: number
  CustomerSN?: string
}

/** 连接状态，界面据此显示不同的指示点 */
export type SocketStatus =
  | 'idle' // 还没开始
  | 'connecting' // 连接中
  | 'open' // 已连接（真实）
  | 'simulating' // 演示模式：本地模拟
  | 'closed' // 已断开（会自动重连）
  | 'disabled' // 没配置地址

export interface UseAlarmSocketOptions {
  /** 收到一条警报推送 */
  onAlarm: (data: AlarmPushData) => void
  /** 心跳间隔（毫秒），默认 25s */
  heartbeatMs?: number
  /** 等 pong 的超时（毫秒），默认 5000 */
  pongTimeoutMs?: number
  /** 演示模式模拟推送的平均间隔（毫秒），默认 12s */
  simulateMs?: number
}

export function useAlarmSocket(options: UseAlarmSocketOptions) {
  const status = ref<SocketStatus>('idle')
  /** 收到的推送条数（界面可以展示"本次已收到 N 条"） */
  const received = ref(0)
  /** 最后一次推送时间 */
  const lastAt = ref<Date | null>(null)

  const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined)?.trim() || ''
  const heartbeatMs = options.heartbeatMs ?? 25000
  const pongTimeoutMs = options.pongTimeoutMs ?? 5000
  const simulateMs = options.simulateMs ?? 12000

  let ws: WebSocket | null = null
  let heartbeatTimer: number | undefined
  let pongTimer: number | undefined
  let simTimer: number | undefined
  let reconnectTimer: number | undefined
  let reconnectDelay = 1000
  let stopped = false
  /** 是否已经在跑（start 幂等，避免 keep-alive 反复激活时重复起定时器） */
  let running = false

  /* ---------------- 演示模式：本地模拟 ---------------- */
  let simSeq = 9000
  function startSimulator() {
    status.value = 'simulating'
    const tick = () => {
      simSeq += 1
      const categories = [1, 2, 3, 4, 5, 6, 7]
      push({
        Id: simSeq,
        SN: `SIM-${simSeq}`,
        CategoryId: categories[simSeq % categories.length],
        CustomerId: 1,
        CustomerSN: '6666'
      })
      // 间隔带点抖动，看起来更像真的
      simTimer = window.setTimeout(tick, simulateMs * (0.6 + Math.random() * 0.8))
    }
    // 首条快一点（3 秒），演示时不用干等
    simTimer = window.setTimeout(tick, 3000)
  }

  /* ---------------- 真实 WebSocket ---------------- */
  function connect() {
    if (stopped || !wsUrl) {
      status.value = wsUrl ? status.value : 'disabled'
      return
    }
    status.value = 'connecting'
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      status.value = 'open'
      reconnectDelay = 1000 // 连上就重置退避
      startHeartbeat()
    }

    ws.onmessage = (evt) => {
      let msg: { Type?: string; code?: string; data?: AlarmPushData } | null = null
      try {
        msg = JSON.parse(String(evt.data))
      } catch {
        return
      }
      if (!msg) return

      // 心跳回复：清掉超时定时器
      if (msg.Type === 'pong') {
        if (pongTimer) {
          window.clearTimeout(pongTimer)
          pongTimer = undefined
        }
        return
      }

      // 警报推送
      if (msg.Type === 'alarm' && msg.data) {
        ack()
        push(msg.data)
      }
    }

    ws.onclose = () => {
      status.value = 'closed'
      stopHeartbeat()
      scheduleReconnect()
    }

    ws.onerror = () => {
      // 交给 onclose 统一处理重连
    }
  }

  /** 文档要求：推送成功后必须回 ack，否则服务端会重复推 */
  function ack() {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ Type: 'ack', code: 'SUCCESS' }))
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    const beat = () => {
      if (ws?.readyState !== WebSocket.OPEN) return
      ws.send(JSON.stringify({ Type: 'ping', Timestamp: Date.now() }))
      // 规定时间内没等到 pong 就当连接已经死了，主动断开触发重连
      pongTimer = window.setTimeout(() => {
        try {
          ws?.close()
        } catch {
          /* ignore */
        }
      }, pongTimeoutMs)
    }
    beat()
    heartbeatTimer = window.setInterval(beat, heartbeatMs)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      window.clearInterval(heartbeatTimer)
      heartbeatTimer = undefined
    }
    if (pongTimer) {
      window.clearTimeout(pongTimer)
      pongTimer = undefined
    }
  }

  function scheduleReconnect() {
    if (stopped) return
    reconnectTimer = window.setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000) // 最长 30s
      connect()
    }, reconnectDelay)
  }

  /* ---------------- 统一的"收到一条"入口 ---------------- */
  function push(data: AlarmPushData) {
    received.value += 1
    lastAt.value = new Date()
    options.onAlarm(data)
  }

  /* ---------------- 生命周期 ---------------- */
  /**
   * 开始接收推送（幂等：已经在跑就直接返回）
   * ⚠️ 调用方要注意 keep-alive：**离开页面必须调 stop()**，
   *    否则心跳会一直发着（后端明确要求"离开就不用管"）。
   *    正确用法是 onActivated→start / onDeactivated→stop。
   */
  function start() {
    if (running) return
    running = true
    stopped = false
    if (DEMO_MODE) {
      startSimulator()
      return
    }
    connect()
  }

  /** 停止接收：清掉所有定时器 + 断开连接 */
  function stop() {
    running = false
    stopped = true
    stopHeartbeat()
    if (simTimer) window.clearTimeout(simTimer)
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    simTimer = undefined
    reconnectTimer = undefined
    try {
      ws?.close()
    } catch {
      /* ignore */
    }
    ws = null
    status.value = 'idle'
  }

  // 兜底：组件真的被销毁时（不在 keep-alive 里的场景）也要停
  onBeforeUnmount(stop)

  return {
    status: readonly(status) as Ref<SocketStatus>,
    received: readonly(received) as Ref<number>,
    lastAt: readonly(lastAt) as Ref<Date | null>,
    start,
    stop
  }
}
