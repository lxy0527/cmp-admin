/**
 * 列表页通用逻辑：**两种分页模式**
 * ============================================================
 * 2026-10-20：后端 9 个列表接口全部加了服务端分页（文档 + 实测确认），
 * 所以这里扩展成双模式，**默认仍是 `client`，老页面一行都不用改**。
 *
 * ┌─ client（默认，兼容旧的）──────────────────────────────
 * │   fetcher 一次拿全量 → computed 过滤 → computed 切片
 * │   适合：数据量小、或者接口还没支持分页
 * │
 * └─ server（新）───────────────────────────────────────
 *     fetchPage({ page, pageSize }) → 只拿当前页 + 总数
 *     ⚠️ 后端 `page` **从 0 开始**，而 el-pagination 是 1 起，
 *        所以这里统一做 `page - 1` 转换，页面不用管。
 *
 * 两种模式的**对外接口完全一致**，页面只改创建时那几行：
 *
 *   // client
 *   useTableList({ fetcher: () => getRows() })
 *
 *   // server
 *   useTableList({
 *     mode: 'server',
 *     fetchPage: ({ page, pageSize }) => getRowsPage({ page, pageSize })
 *   })
 */
import { computed, ref, watch, type Ref } from 'vue'

/** 服务端分页接口的返回形状（由 api 层拼好） */
export interface PagedData<T> {
  list: T[]
  total: number
}

interface ClientOptions<T> {
  /** 默认模式 */
  mode?: 'client'
  /** 拿全量数据 */
  fetcher: () => Promise<T[]>
  /** 本地筛选：返回 true 表示保留该行。读到的响应式变量会被自动追踪 */
  filterFn?: (row: T) => boolean
  /** 每页条数，默认 20 */
  pageSize?: number
}

interface ServerOptions<T> {
  mode: 'server'
  /** 按页取数据（page 从 1 开始，内部会 -1 再传给后端） */
  fetchPage: (params: { page: number; pageSize: number }) => Promise<PagedData<T>>
  pageSize?: number
}

export type UseTableListOptions<T> = ClientOptions<T> | ServerOptions<T>

export function useTableList<T>(options: UseTableListOptions<T>) {
  const isServer = options.mode === 'server'

  /** client 模式：接口返回的全量数据 */
  const all = ref([]) as Ref<T[]>
  /** server 模式：当前页数据 */
  const serverList = ref([]) as Ref<T[]>
  /** server 模式：后端给的总条数 */
  const serverTotal = ref(0)

  const loading = ref(false)
  const error = ref('')

  const pageNum = ref(1)
  const pageSize = ref(options.pageSize ?? 20)

  /** client 模式的过滤结果；server 模式就是当前页 */
  const filtered = computed<T[]>(() => {
    if (isServer) return serverList.value
    const fn = (options as ClientOptions<T>).filterFn
    return fn ? all.value.filter((row) => fn(row)) : all.value
  })

  const total = computed(() => (isServer ? serverTotal.value : filtered.value.length))

  /** 当前页要渲染的数据 */
  const list = computed<T[]>(() => {
    if (isServer) return serverList.value
    const start = (pageNum.value - 1) * pageSize.value
    return filtered.value.slice(start, start + pageSize.value)
  })

  /**
   * 请求序号：防止「快速翻页时旧请求后到」覆盖新结果。
   * 只有服务端分页会遇到，client 模式无副作用。
   */
  let reqSeq = 0

  async function loadServer() {
    if (options.mode !== 'server') return
    const seq = ++reqSeq
    const res = await options.fetchPage({ page: pageNum.value, pageSize: pageSize.value })
    if (seq !== reqSeq) return // 已有更新的请求，丢弃本次结果
    serverList.value = res.list
    serverTotal.value = res.total
  }

  /** 拉数据（首次进入 / 增删改后刷新 / 翻页都用它） */
  async function load() {
    loading.value = true
    error.value = ''
    try {
      if (isServer) {
        await loadServer()
        // 数据变少时把页码收回来，避免停在越界的空白页
        const maxPage = Math.max(1, Math.ceil(serverTotal.value / pageSize.value))
        if (pageNum.value > maxPage) {
          pageNum.value = maxPage
          await loadServer()
        }
      } else {
        all.value = (await (options as ClientOptions<T>).fetcher()) ?? []
        const maxPage = Math.max(1, Math.ceil(total.value / pageSize.value))
        if (pageNum.value > maxPage) pageNum.value = maxPage
      }
    } catch (e) {
      all.value = []
      serverList.value = []
      error.value = (e as Error)?.message || '資料加載失敗'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * server 模式：页码 / 每页条数变了自动重新请求（页面不用写 @current-change）。
   * client 模式不监听（数据已在本地，computed 会自己重算）。
   */
  if (isServer) {
    watch([pageNum, pageSize], () => {
      void load()
    })
  }

  /** 点了"查询"：回到第 1 页（server 模式下由调用方随后 load，或页码变化触发 watch） */
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
