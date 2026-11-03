/**
 * 警报实时推送（WebSocket）
 * ============================================================
 * 文档里的接口：`wss://域名/api/alarmWebSocket`
 *
 * 握手参数（文档 2026-11 改版后**全部必传**）：
 *   ApiId / token / CustomerSN / Timestamp
 *   ★ 已废弃 ApiKey —— 现在用登录拿到的用户级 token，放在 URL 查询串里。
 *
 * 帧格式：
 *   客户端心跳  {"Type":"ping","Timestamp":1234567890}
 *   服务端回    {"Type":"pong","Timestamp":1234567890}
 *   服务端推    {"Type":"alarm","code":"SUCCESS","data":{"Id":1,"SN":"1001",...}}
 *   客户端必须回 {"Type":"ack","code":"SUCCESS"}   ← 不回服务端会重复推
 *
 * ⚠️ 四个现实约束（决定了本文件的实现方式）：
 *
 *   1. **握手 URL 必须运行时拼**。token 只有 **3 小时**有效期，
 *      而以前是"配一个带 apiKey 的完整 URL"（`VITE_WS_URL`）——那时 key 是长期的，
 *      静态配置没问题；换成 token 后同一个 URL 两小时后就是废纸。
 *      所以 `VITE_WS_URL` 现在只当**基础地址**，Query 每次连接时现拼：
 *        ?ApiId=...&token=...&CustomerSN=...&Timestamp=...
 *
 *   2. **缺任何一项都不连**。不拿空 ApiId/CustomerSN 去试探后端，
 *      更不假装"已连接"——界面显示"未配置"并**明确指出缺哪一项**。
 *
 *   3. **token 要在过期前续**。调用 `/api/refresh`（Scene=Chart）换新 token，
 *      连接期间每 30 分钟续一次；否则大屏挂满 3 小时，一断线就再也连不回来。
 *
 *   4. **演示模式下没有后端**，用本地模拟器按固定节奏造推送，
 *      界面上显示"模擬推送"，不会冒充真实连接。
 *
 *   心跳超时（文档建议约 5 秒收不到 pong）就主动重连，重连用**指数退避**。
 *
 * ⚠️ 已知风险（已向后端提出，等他们评估）：token 放在 URL 里会被网关日志、
 *    浏览器历史、Referer 记录，3 小时内等于明文凭据。更稳的做法是握手用
 *    一次性短期票据，或走 `Sec-WebSocket-Protocol` 头。
 */
import { onBeforeUnmount, readonly, ref, type Ref } from 'vue'
import { DEMO_MODE } from '@/demo'
import { USER_TOKEN_KEY } from '@/api/request'
import { refreshTokenApi, TOKEN_REFRESH_MS } from '@/api/auth'
import { storage } from '@/utils/storage'

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
  | 'disabled' // 缺配置（见 missingConfig）

/**
 * 握手缺哪一项（技术名，界面直接显示给开发/运维看，不需要翻译）
 * 用来替代过去笼统的"未配置"——缺 VITE_WS_URL 和缺 token 是两码事，
 * 一个是部署没配，一个是登录态没了。
 */
export type MissingHandshakeField = 'VITE_WS_URL' | 'VITE_API_ID' | 'token' | 'CustomerSN'

export interface UseAlarmSocketOptions {
  /** 收到一条警报推送 */
  onAlarm: (data: AlarmPushData) => void
  /**
   * 握手用的客户编号。
   * admin 账号对应哪个 CustomerSN 尚未与需求方确认，所以先做成可传入；
   * 不传则回落到 `VITE_WS_CUSTOMER_SN`，两者都没有就视为缺配置（不连）。
   */
  customerSN?: string
  /** 心跳间隔（毫秒），默认 25s */
  heartbeatMs?: number
  /** 等 pong 的超时（毫秒），默认 5000 */
  pongTimeoutMs?: number
  /** 演示模式模拟推送的平均间隔（毫秒），默认 12s */
  simulateMs?: number
}

/* ============================================================
 * 握手配置（构建期注入，不含任何密钥）
 * ============================================================ */
/** 基础地址：`ws://host:port`，可带或不带路径 */
const WS_BASE = (import.meta.env.VITE_WS_URL as string | undefined)?.trim() || ''
/** 应用标识：文档要求握手必传。不是密钥，本来就会出现在 URL 里 */
const WS_API_ID = (import.meta.env.VITE_API_ID as string | undefined)?.trim() || ''
/** 客户编号：admin 账号口径未定，先留环境变量位 */
const WS_CUSTOMER_SN = (import.meta.env.VITE_WS_CUSTOMER_SN as string | undefined)?.trim() || ''
/** 握手路径（文档：alarmWebSocket） */
const WS_PATH = '/api/alarmWebSocket'
/**
 * 连接"存活"多久才算真的连上（毫秒）。
 * 低于这个时长就被关掉，视为失败，退避继续增长 —— 见 ws.onclose 里的说明。
 */
const STABLE_MS = 10000

/**
 * 拼出**这一次**的握手地址。
 *
 * 每次连接都要重拼，不能缓存：token 只有 3 小时，Timestamp 更是每次都变。
 *
 * @param customerSN 调用方指定的客户编号（优先于环境变量）
 * @returns url（缺配置时为空串）+ missing（缺了哪几项）
 */
function buildHandshake(customerSN?: string): { url: string; missing: MissingHandshakeField[] } {
  const missing: MissingHandshakeField[] = []
  const token = storage.get<string>(USER_TOKEN_KEY) || ''
  const sn = (customerSN || WS_CUSTOMER_SN).trim()

  if (!WS_BASE) missing.push('VITE_WS_URL')
  if (!WS_API_ID) missing.push('VITE_API_ID')
  if (!token) missing.push('token')
  if (!sn) missing.push('CustomerSN')
  if (missing.length) return { url: '', missing }

  // 允许只配 host:port，也允许直接配到 /api/xxx；不重复拼路径
  const url = /\/api\/[^/]+$/.test(WS_BASE) ? WS_BASE : `${WS_BASE.replace(/\/+$/, '')}${WS_PATH}`
  const sep = url.includes('?') ? '&' : '?'
  const query = new URLSearchParams({
    ApiId: WS_API_ID,
    token,
    CustomerSN: sn,
    Timestamp: String(Date.now())
  })

  // ⚠️ 不要在这个地址上打日志：token 在 URL 里
  return { url: `${url}${sep}${query.toString()}`, missing }
}

export function useAlarmSocket(options: UseAlarmSocketOptions) {
  const status = ref<SocketStatus>('idle')
  /** 收到的推送条数（界面可以展示"本次已收到 N 条"） */
  const received = ref(0)
  /** 最后一次推送时间 */
  const lastAt = ref<Date | null>(null)

  const heartbeatMs = options.heartbeatMs ?? 25000
  const pongTimeoutMs = options.pongTimeoutMs ?? 5000
  const simulateMs = options.simulateMs ?? 12000

  /** 握手缺哪一项（空数组 = 配置齐全） */
  const missingConfig = ref<MissingHandshakeField[]>([])

  let ws: WebSocket | null = null
  let heartbeatTimer: number | undefined
  let pongTimer: number | undefined
  let simTimer: number | undefined
  let reconnectTimer: number | undefined
  /** token 续期定时器（仅在连接期间跑） */
  let refreshTimer: number | undefined
  /** 本次连接的成功时刻（用来判断是不是"开了就关"的假连接） */
  let openedAt = 0
  /** 重连退避：1s → 2s → 4s …… 最长 30s */
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

  /* ---------------- token 续期 ----------------
   * token 3 小时有效，而看板/大屏是长期挂着的页面。
   * 续期时机的两个关键点：
   *   1. **每次连接前**检查一次 —— 因为握手 URL 里的 token 是现拼的，
   *      拿过期 token 去连必然 401/关闭，然后无限重连，界面一直显示"已断开"。
   *   2. **连接期间**每 30 分钟续一次 —— 保证下一次重连手里是新鲜 token。
   */
  let lastRefreshAt = 0

  async function ensureFreshToken(force = false): Promise<void> {
    if (!storage.get<string>(USER_TOKEN_KEY)) return
    if (!force && lastRefreshAt && Date.now() - lastRefreshAt < TOKEN_REFRESH_MS) return
    try {
      const fresh = await refreshTokenApi('Chart')
      if (fresh) lastRefreshAt = Date.now()
    } catch {
      // 续不动（后端没实现 / 网络抖动）：老 token 也许还能用，让握手去试。
      // 真过期了 HTTP 请求会被拦截器送回登录页，不在这里抢着处理。
    }
  }

  /* ---------------- 真实 WebSocket ---------------- */
  async function connect() {
    if (stopped) return

    // 先续 token，再拼 URL —— 顺序反了就等于拿旧票进场
    const precheck = buildHandshake(options.customerSN)
    missingConfig.value = precheck.missing
    if (precheck.missing.length) {
      status.value = 'disabled'
      return
    }

    status.value = 'connecting'
    await ensureFreshToken()

    // 续期是异步的：这期间页面可能已经被切走（keep-alive 调了 stop），别再把连接建起来
    if (stopped) return

    // 续期可能失败/被登出，这里必须重算一次
    const plan = buildHandshake(options.customerSN)
    missingConfig.value = plan.missing
    if (!plan.url) {
      status.value = 'disabled'
      return
    }

    try {
      ws = new WebSocket(plan.url)
    } catch {
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      status.value = 'open'
      openedAt = Date.now()
      startHeartbeat()
      // 挂着的时候也别让 token 馊掉
      if (refreshTimer) window.clearInterval(refreshTimer)
      refreshTimer = window.setInterval(() => void ensureFreshToken(), TOKEN_REFRESH_MS)
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
      if (refreshTimer) {
        window.clearInterval(refreshTimer)
        refreshTimer = undefined
      }
      /**
       * ★ 只有"活够久"的连接才算真连上，才把退避重置回 1 秒。
       *
       * 踩过的坑：握手被服务端接受、但拿不到数据就立刻被关（token 无效时就是这样，
       * 浏览器看到的是 open → 100ms 内 1006 关闭）。如果在 onopen 里无条件重置退避，
       * 这种"开了就关"的抖动会让重试永远停在 1 秒一次，变成对后端的持续轰击，
       * 界面指示灯也跟着每秒闪一次。
       */
      if (openedAt && Date.now() - openedAt >= STABLE_MS) reconnectDelay = 1000
      openedAt = 0
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
      void connect()
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
    reconnectDelay = 1000 // 每次重新激活都从最短退避开始
    if (DEMO_MODE) {
      startSimulator()
      return
    }
    void connect()
  }

  /** 停止接收：清掉所有定时器 + 断开连接 */
  function stop() {
    running = false
    stopped = true
    stopHeartbeat()
    if (simTimer) window.clearTimeout(simTimer)
    if (reconnectTimer) window.clearTimeout(reconnectTimer)
    if (refreshTimer) window.clearInterval(refreshTimer)
    simTimer = undefined
    reconnectTimer = undefined
    refreshTimer = undefined
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
    /** 握手缺哪一项（界面用来给出具体提示，而不是一句笼统的"未配置"） */
    missingConfig: readonly(missingConfig) as Ref<MissingHandshakeField[]>,
    start,
    stop
  }
}
