/**
 * 列表页通用逻辑：**前端分页 + 前端筛选**
 * ============================================================
 * 为什么是前端分页：后端已明确不做分页，列表接口一次返回全量数组。
 * 所以流程是：
 *
 *   接口（全量数组） → all
 *        ↓ computed 按查询条件过滤
 *    filtered（命中全部条件的数据）
 *        ↓ computed 按页码切片
 *     list（当前页要渲染的数据，喂给 el-table）
 *
 * 用法（一个列表页只需要给"怎么拿数据"和"怎么筛"，其余全由本函数处理）：
 *
 *   const query = reactive({ keyword: '', type: '' })
 *   const table = useTableList<Row>({
 *     fetcher: () => getRowsApi(),                          // 拿全量
 *     filterFn: (r) => !query.keyword || r.name.includes(query.keyword)
 *   })
 *   table.load()     // 手动加载
 *
 *   <el-table :data="table.list.value" />
 *   <el-pagination v-model:current-page="table.pageNum.value" :total="table.total.value" />
 *
 * ⚠️ 两个容易写脏的点，这里已经统一处理：
 *   1. **筛选条件变化后必须回到第 1 页** —— 否则会停在第 5 页看着空表格（调 search()）
 *   2. **删掉几行后当前页可能越界** —— load() 里会自动把页码收回到最后一页
 */
import { computed, ref, type Ref } from 'vue'

export interface UseTableListOptions<T> {
  /** 拿全量数据（后端不分页） */
  fetcher: () => Promise<T[]>
  /** 本地筛选：返回 true 表示保留该行。读到的响应式变量会被自动追踪 */
  filterFn?: (row: T) => boolean
  /** 每页条数，默认 20 */
  pageSize?: number
}

export function useTableList<T>(options: UseTableListOptions<T>) {
  /** 接口返回的全量数据（不对外，页面用 filtered/list） */
  const all = ref([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref('')

  const pageNum = ref(1)
  const pageSize = ref(options.pageSize ?? 20)

  /** 过滤后的全量（总数用它的长度） */
  const filtered = computed<T[]>(() =>
    options.filterFn ? all.value.filter((row) => options.filterFn!(row)) : all.value
  )

  const total = computed(() => filtered.value.length)

  /** 当前页的数据 */
  const list = computed<T[]>(() => {
    const start = (pageNum.value - 1) * pageSize.value
    return filtered.value.slice(start, start + pageSize.value)
  })

  /** 拉数据（首次进入 / 增删改后刷新都用它） */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      all.value = (await options.fetcher()) ?? []
      // 数据变少时把页码收回来，避免停在越界的空白页
      const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value))
      if (pageNum.value > maxPage) pageNum.value = maxPage
    } catch (e) {
      all.value = []
      error.value = (e as Error)?.message || '資料加載失敗'
      throw e
    } finally {
      loading.value = false
    }
  }

  /** 点了"查询"：回到第 1 页（数据本身是本地过滤，不需要重新请求） */
  function search() {
    pageNum.value = 1
  }

  /** 重置查询条件后调用：同样要回到第 1 页 */
  function resetPage() {
    pageNum.value = 1
  }

  /** 每页条数变化 */
  function handleSizeChange() {
    pageNum.value = 1
  }

  return {
    all,
    filtered,
    list,
    loading,
    error,
    pageNum,
    pageSize,
    total,
    load,
    search,
    resetPage,
    handleSizeChange
  }
}
