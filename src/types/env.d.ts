/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK: string
  readonly VITE_USE_AUTH: string
  readonly VITE_APP_TITLE: string
  readonly VITE_DEMO_MODE: string
  /** token 请求头名与前缀（默认 Authorization / Bearer） */
  readonly VITE_AUTH_TOKEN_HEADER: string
  readonly VITE_AUTH_TOKEN_PREFIX: string
  /**
   * WebSocket 握手地址的**基础部分**：`ws://host:port`（可带或不带 /api/xxx 路径）
   * ⚠️ 不要在这里写完整的握手 URL —— token 只有 3 小时，URL 必须运行时拼
   */
  readonly VITE_WS_URL: string
  /** WebSocket 握手必传的 ApiId（应用标识，不是密钥） */
  readonly VITE_API_ID: string
  /** WebSocket 握手必传的 CustomerSN（admin 账号口径未定，先留配置位） */
  readonly VITE_WS_CUSTOMER_SN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
