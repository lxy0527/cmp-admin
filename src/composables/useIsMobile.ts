/**
 * 是否窄屏（移动端）
 * ------------------------------------------------------------
 * 为什么需要它：`el-pagination` 的 `pager-count`（页码个数）是 **prop**，
 * 不是样式，纯 CSS 改不了「最多显示几个页码」。所以窄屏少显示几页只能由 JS 决定。
 *
 * 断点与 `src/styles/index.scss`、`MainLayout.vue` 里的 `@media (max-width: 900px)`
 * 保持一致，三处任意一个改，另外两个必须一起改，否则会出现"样式换了但页码没换"。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const MOBILE_QUERY = '(max-width: 900px)'

export function useIsMobile() {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  const sync = (e: MediaQueryList | MediaQueryListEvent) => {
    isMobile.value = e.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mql = window.matchMedia(MOBILE_QUERY)
    sync(mql)
    mql.addEventListener('change', sync)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', sync)
    mql = null
  })

  return isMobile
}
