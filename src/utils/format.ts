/**
 * 日期时间格式化工具
 * ------------------------------------------------------------
 * 为什么不引 dayjs：现阶段只需要几个固定格式，没必要加依赖。
 * 后面如果出现时区、相对时间、多语言格式等需求，再换 dayjs（替换本文件即可，调用处签名不变）。
 */

/** 补零：7 → "07" */
const pad = (n: number) => String(n).padStart(2, '0')

/** 2026-09-12 */
export function formatDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 10:43:06 */
export function formatTime(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 2026-09-12 10:43:06 */
export function formatDateTime(date: Date = new Date()): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

const WEEK_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

/** 星期六 */
export function formatWeek(date: Date = new Date()): string {
  return WEEK_CN[date.getDay()]
}

/**
 * 农历展示（**演示用的伪实现**，不是真农历）
 * ------------------------------------------------------------
 * 目的只是让顶栏"農曆 xx月xx"有个东西显示。
 * 真要准：引 lunar-javascript 之类的库，或干脆由后端返回 lunarText 字段。
 * 待确认：顶栏这个农历到底是前端算还是后端给？倾向于后端给（省事且统一）。
 */
export function formatLunar(date: Date = new Date()): string {
  const months = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
  const days = [
    '初一',
    '初二',
    '初三',
    '初四',
    '初五',
    '初六',
    '初七',
    '初八',
    '初九',
    '初十',
    '十一',
    '十二',
    '十三',
    '十四',
    '十五',
    '十六',
    '十七',
    '十八',
    '十九',
    '二十',
    '廿一',
    '廿二',
    '廿三',
    '廿四',
    '廿五',
    '廿六',
    '廿七',
    '廿八',
    '廿九',
    '三十'
  ]
  // 用日期做一个稳定的伪随机偏移：保证同一天内多次渲染结果一致，不会闪
  const dayIndex = (date.getDate() * 7 + date.getMonth() * 3) % 30
  const monthIndex = (date.getMonth() + 5) % 12
  return `${months[monthIndex]}月${days[dayIndex]}`
}

/* ============================================================
 * 后端时间解析
 * ============================================================
 * CMP 后端返回的时间字段有几种写法（实测都出现过）：
 *   1. .NET 格式   "/Date(1784002390497)/"      ← 列表接口大量使用
 *   2. 普通字符串  "2026-10-15 09:15:00"
 *   3. ISO 8601    "2026-10-15T09:15:00"
 * 统一在这里吃掉，业务层只拿 Date 或格式化好的字符串。
 *
 * ⚠️ Safari/iOS 不认 "2026-10-15 09:15:00"（空格分隔），
 *    所以字符串分支会先把空格换成 T 再解析。
 */

/** 把后端的各种时间写法解析成 Date；解析不了返回 null（不抛异常，避免一条脏数据打断整个列表） */
export function parseServerDate(value?: string | number | null): Date | null {
  if (value === null || value === undefined || value === '') return null

  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Date(value) : null
  }

  const str = String(value).trim()

  // "/Date(1784002390497)/" —— 括号里可能带时区，如 /Date(1784002390497+0800)/
  const dotNet = str.match(/^\/Date\((-?\d+)([+-]\d{4})?\)\/$/)
  if (dotNet) {
    const ms = Number(dotNet[1])
    if (!Number.isFinite(ms)) return null
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // 纯数字字符串当作毫秒时间戳
  if (/^-?\d{10,}$/.test(str)) {
    const d = new Date(Number(str))
    return Number.isNaN(d.getTime()) ? null : d
  }

  // "2026-10-15 09:15:00" → 换成 T，兼容 iOS
  const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 格式化成 "2026-10-15 09:15:00"；解析不了就给 fallback（默认 "--"） */
export function formatServerDateTime(value?: string | number | null, fallback = '--'): string {
  const d = parseServerDate(value)
  return d ? formatDateTime(d) : fallback
}
