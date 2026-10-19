/**
 * i18n 实例
 * ============================================================
 * 三语：繁體中文（預設）/ 简体中文 / English
 *
 * 两个必须一起配的东西（少一个就会出现"半截英文"）：
 *   1. 本文件的 vue-i18n 实例 —— 管**我们自己的**文案
 *   2. Element Plus 的语言包（ELEMENT_LOCALES）—— 管**组件自带的**文案
 *      （分页器"共 x 条"、日期选择器、表格"暂无数据"、确认框按钮…）
 *      通过 App.vue 的 <el-config-provider :locale> 注入，最容易漏的一处。
 *
 * 术语来源：旧站（CMP2.0）语言包，见 docs/reference/。
 */
import { createI18n } from 'vue-i18n'
import elZhTw from 'element-plus/es/locale/lang/zh-tw'
import elZhCn from 'element-plus/es/locale/lang/zh-cn'
import elEn from 'element-plus/es/locale/lang/en'

import zhTW from './zh-TW'
import zhCN from './zh-CN'
import en from './en'
import { storage } from '@/utils/storage'

export type LocaleKey = 'zh-TW' | 'zh-CN' | 'en'

/** localStorage 里存语言的 key */
const LOCALE_KEY = 'locale'

/** 需求方定的默认语言：繁体 */
export const FALLBACK_LOCALE: LocaleKey = 'zh-TW'

/** 语言切换器的选项 */
export const LOCALE_OPTIONS: { value: LocaleKey; label: string }[] = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en', label: 'English' }
]

/** Element Plus 各语言包（组件内置文案） */
export const ELEMENT_LOCALES: Record<LocaleKey, typeof elZhTw> = {
  'zh-TW': elZhTw,
  'zh-CN': elZhCn,
  en: elEn
}

const isLocaleKey = (v: unknown): v is LocaleKey =>
  typeof v === 'string' && LOCALE_OPTIONS.some((o) => o.value === v)

/**
 * 初始语言优先级：
 *   用户上次选择（localStorage）> .env 的 VITE_DEFAULT_LOCALE > 繁体
 */
function resolveInitialLocale(): LocaleKey {
  const saved = storage.get<string>(LOCALE_KEY)
  if (isLocaleKey(saved)) return saved
  const envDefault = import.meta.env.VITE_DEFAULT_LOCALE
  if (isLocaleKey(envDefault)) return envDefault
  return FALLBACK_LOCALE
}

export const i18n = createI18n({
  // legacy: false → Composition API 模式（模板里 $t、代码里 useI18n()）
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  // 兜底也设成繁体：万一某个 key 只翻了繁英、漏了简中，不会掉成 key 名
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    'zh-TW': zhTW,
    'zh-CN': zhCN,
    en
  }
})

/** 当前语言 */
export function getLocale(): LocaleKey {
  return i18n.global.locale.value as LocaleKey
}

/** 切换语言：更新 i18n → 写回 localStorage → 同步 <html lang> */
export function setLocale(locale: LocaleKey) {
  i18n.global.locale.value = locale
  storage.set(LOCALE_KEY, locale)
  applyHtmlLang(locale)
}

/**
 * <html lang> 跟随语言切换。
 * 影响字体回退与无障碍朗读（zh-Hant 才会挑到正确的繁体字形）。
 */
export function applyHtmlLang(locale: LocaleKey) {
  document.documentElement.lang =
    locale === 'zh-TW' ? 'zh-Hant' : locale === 'zh-CN' ? 'zh-Hans' : 'en'
}

/** 应用启动时调一次，把已保存的语言同步到 <html lang> */
export function initLocale() {
  applyHtmlLang(getLocale())
}

export default i18n
