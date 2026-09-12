/**
 * 许可作业列表 —— 假数据
 * ============================================================
 * 两个数据源，别搞混：
 *   ① SCREENSHOT_PAGE —— 按设计图逐条照抄的那 20 行，只在"首屏无筛选"时返回，
 *      用来保证页面初始状态和截图一致（方便对图验收）。
 *   ② DB —— 程序生成的 1633 条，用于分页/筛选看起来像真的。
 *
 * 真实接口就绪后：整个文件可以删掉（api/permitWork.ts 里 USE_MOCK 分支一起删）。
 */
import type { PageQuery, PageResult } from '@/types/api'
import { delay, ok } from './helper'

export interface PermitWorkRow {
  id: number
  /** 许可ID（列表第 2 列） */
  permitId: string
  /** 工作票编号（列表第 3 列，同时作为"许可作业区域"的筛选值） */
  workPermitNo: string
  permitType: string
  status: '申请待批' | '许可待批' | '工作结束' | '已取消'
  modelContent: string
  applicant: string
  applyDate: string
}

export interface PermitWorkQuery extends PageQuery {
  permitArea?: string
  permitType?: string
  company?: string
  dateRange?: string[]
}

/** 假数据总量：为了分页器好看（截图上是 1633 条） */
const TOTAL = 1633

/* ---------------- 生成假数据用的候选值（同样是按截图抄的） ---------------- */
const AREAS = ['A-1789175849', 'A-1789174967', 'A-1789056238', 'L-1789142407', 'A-1789149658']
const TYPES = ['热工作业', '升降機維修工作', '起重機維修檢查', '密閉空間']
const STATUS: PermitWorkRow['status'][] = ['申请待批', '许可待批', '工作结束', '已取消']
const CONTENTS = ['吊船检查', '吊机检测', '升降梯检查', '吊船检查', '吊机检测']
const COMPANIES = ['金力鋼結構有限公司', '聲馳工程', '鴻昌(洪良)棚架', '俊和建築', '利堅信保', '科進水務']
/** 少数行"许可申请人"列显示的是审批状态而不是公司名，这里也照抄 */
const APPLY_STATUS = ['申請處理', '申請退回', '資料提交', '許可申請', '架廠處理']

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * 生成 1633 条假数据
 * 注意日期用 `Math.max(1, 12 - (i % 12))`：限定在 9 月 1~12 日之间，
 * 避免 `new Date(2026, 8, 0)` 这类越界值被自动回退到 8 月，导致日期看起来乱。
 */
const DB: PermitWorkRow[] = Array.from({ length: TOTAL }, (_, i) => {
  const idx = TOTAL - i
  const d = new Date(2026, 8, Math.max(1, 12 - (i % 12)), 8 + (i % 10), (i * 7) % 60, (i * 13) % 60)
  const isLiftOrSpace = i % 5 === 3 || i % 7 === 4
  return {
    id: i + 1,
    permitId: idx % 11 === 0 ? String(2200 + (i % 40)) : String(2220 + (TOTAL - i)),
    workPermitNo: `${i % 3 === 0 ? 'A' : 'L'}-1789${1000 + ((i * 37) % 8999)}`,
    permitType: isLiftOrSpace ? '升降機維修工作' : TYPES[i % TYPES.length],
    status: STATUS[i % STATUS.length],
    modelContent: idx % 13 === 0 ? '密閉空間' : CONTENTS[i % CONTENTS.length],
    applicant: i % 11 === 0 ? APPLY_STATUS[i % APPLY_STATUS.length] : COMPANIES[i % COMPANIES.length],
    applyDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
})

/** 首屏展示用：按设计图逐条抄的 20 行（字段顺序：许可ID/工作票编号/许可类型/状态/模型内容/申请人/申请日期） */
const SCREENSHOT_PAGE: PermitWorkRow[] = [
  ['2229', 'A-1789175849', '热工作业', '申请待批', '吊船检查', '金力鋼結構有限公司', '2026-09-12 09:04'],
  ['2238', 'A-1789174967', '热工作业', '申请待批', '吊机检测', '聲馳工程', '2026-09-12 09:01'],
  ['2227', 'A-1789056238', '热工作业', '许可待批', '吊船检查', '金力鋼結構有限公司', '2026-09-12 11:53'],
  ['76', 'L-1789142407', '升降機維修工作', '工作结束', '升降梯检查', '鴻昌(洪良)棚架', '2026-09-11 17:39'],
  ['2236', 'A-1789149658', '热工作业', '许可待批', '吊船检查', '鴻昌(洪良)棚架', '2026-09-10 08:56'],
  ['2235', 'A-1789053636', '热工作业', '许可待批', '吊机检测', '鴻昌(洪良)棚架', '2026-09-08 17:51'],
  ['2234', 'A-1789053624', '热工作业', '许可待批', '吊机检测', '鴻昌(洪良)棚架', '2026-09-08 17:51'],
  ['2230', 'A-1788640944', '热工作业', '许可待批', '吊船检查', '鴻昌(洪良)棚架', '2026-09-07 12:28'],
  ['2231', 'A-1788054958', '热工作业', '许可待批', '吊船检查', '聲馳工程', '2026-09-07 12:27'],
  ['2232', 'A-1788570133', '热工作业', '许可待批', '吊船检查', '聲馳工程', '2026-09-07 12:27'],
  ['75', 'L-1788504797', '升降機維修工作', '工作结束', '升降梯检查', '利堅信保', '2026-09-04 10:00'],
  ['74', 'L-1788402977', '升降機維修工作', '工作结束', '升降梯检查', '聲馳工程', '2026-09-04 16:39'],
  ['456', 'A-1787873262', '起重機維修檢查', '许可待批', '吊机检测', '利堅信保', '2026-09-04 10:50'],
  ['2227', 'A-1788397525', '热工作业', '许可待批', '吊船检查', '鴻昌(洪良)棚架', '2026-09-04 10:49'],
  ['2228', 'A-1788395909', '热工作业', '许可待批', '吊船检查', '聲馳工程', '2026-09-04 10:48'],
  ['2229', 'A-1788066506', '热工作业', '许可待批', '吊船检查', '金力鋼結構有限公司', '2026-09-04 10:48'],
  ['73', 'L-1788452337', '升降機維修工作', '工作结束', '升降梯检查', '聲馳工程', '2026-09-03 17:27'],
  ['2226', 'A-1788311330', '热工作业', '许可待批', '吊机检测', '鴻昌(洪良)棚架', '2026-09-03 15:27'],
  ['2225', 'A-1788305901', '热工作业', '许可待批', '吊机检测', '科進水務', '2026-09-03 15:27'],
  ['41', 'C-1786318350', '密閉空間', '许可待批', '吊船检查', '利堅信保', '2026-09-02 22:54']
].map((r, i) => ({
  id: i + 1,
  permitId: r[0],
  workPermitNo: r[1],
  permitType: r[2],
  status: r[3] as PermitWorkRow['status'],
  modelContent: r[4],
  applicant: r[5],
  applyDate: r[6]
}))

/** 逐字段过滤：所有填了的条件都要命中才保留（与后端多条件 AND 的预期一致） */
function filterRows(params: PermitWorkQuery): PermitWorkRow[] {
  return DB.filter((row) => {
    if (params.permitArea && row.workPermitNo !== params.permitArea) return false
    if (params.permitType && row.permitType !== params.permitType) return false
    if (params.company && row.applicant !== params.company) return false
    if (params.dateRange?.length === 2) {
      const [start, end] = params.dateRange
      const day = row.applyDate.slice(0, 10)
      if (start && day < start.slice(0, 10)) return false
      if (end && day > end.slice(0, 10)) return false
    }
    return true
  })
}

/**
 * 分页查询（假实现）
 * 规则：第 1 页 + 没填任何**关键字**筛选项 → 返回设计图那 20 条。
 * 注意"日期范围"不算关键字筛选：它是页面默认值（一进来就有），
 * 如果把它算作筛选，首屏就永远走不到 SCREENSHOT_PAGE 了 —— 这个坑踩过。
 */
export async function mockGetPermitWorkPage(
  params: PermitWorkQuery
): Promise<PageResult<PermitWorkRow>> {
  await delay()
  const isFirstLoad = !params.permitArea && !params.permitType && !params.company

  if (isFirstLoad && params.pageNum === 1) {
    return { list: SCREENSHOT_PAGE, total: TOTAL, pageNum: 1, pageSize: params.pageSize }
  }

  const rows = filterRows(params)
  const start = (params.pageNum - 1) * params.pageSize
  return {
    list: rows.slice(start, start + params.pageSize),
    // 未筛选时总数仍用 TOTAL，保证分页器显示"共 1633 条"，翻页能一直翻下去
    total: isFirstLoad ? TOTAL : rows.length,
    pageNum: params.pageNum,
    pageSize: params.pageSize
  }
}

/** 导出（假实现，只延迟一下表示"提交成功"） */
export async function mockExportPermitWork() {
  await delay(500)
  return ok('true')
}

/** 下拉选项的假数据（真实场景应来自字典接口） */
export const permitWorkOptions = {
  permitArea: AREAS,
  permitType: [...new Set(TYPES)],
  company: COMPANIES
}
