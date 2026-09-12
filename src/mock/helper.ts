/**
 * mock 公共部分
 * ------------------------------------------------------------
 * 这里只放三样东西：总开关、延迟模拟、统一返回结构包装。
 * 各业务 mock（auth / permitWork / role / dashboard）都从这里取。
 */
import type { ApiResult } from '@/types/api'

/**
 * mock 总开关
 * 默认开启；只有显式配成 `VITE_USE_MOCK=false` 才走真实接口。
 * 这样"忘了配环境变量"时是走 mock（能跑起来），而不是打到不存在的后端上白屏。
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/**
 * 模拟网络延迟
 * 存在的意义：让 loading 状态、分页切换的 loading 效果在开发时真的能看到，
 * 否则同步返回会让 loading 一闪而过，等接真实接口时才发现没写 loading。
 */
export function delay(ms = 260) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 包装成后端统一返回结构（mock 内部需要返回完整结构时用，见 permitWork 的导出） */
export function ok<T>(data: T, message = 'success'): ApiResult<T> {
  return { code: 200, data, message }
}

/** 失败结构（当前用得少，主要给"导出失败"之类的场景留口子） */
export function fail(message = '操作失败', code = 500): ApiResult<null> {
  return { code, data: null, message }
}
