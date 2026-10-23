/**
 * 用户协议 / 隐私政策 —— 唯一数据源
 *
 * ============================================================================
 * ⚠️ 当前是「占位内容」（isPlaceholder = true）
 * ============================================================================
 * 2026-10-20 与客户确认：正式条款由客户/法务提供，前端先留占位。
 *
 * 替换方式（不需要动任何 .vue 文件）：
 *   1. 把下面每份文档的 `paragraphs` 换成正式条款正文（按段落拆成字符串数组即可，
 *      段落里可以用 `\n` 手动换行）；
 *   2. 把 `version` 改成正式版本号（如 '2026-11-01'），会显示在弹窗右上角；
 *   3. 把 `isPlaceholder` 改成 `false` —— 弹窗顶部的黄色「占位」提示会自动消失。
 *
 * 为什么不直接把正文写进 i18n：
 *   条款是长文本且三语各一份，塞进 locales 会让三个语言包膨胀且容易漏译；
 *   单独一个配置文件也方便法务直接改这一处。
 * ============================================================================
 */

/** 单份协议文档 */
export interface AgreementDoc {
  /** 内部标识，也是 i18n 标题的 key 后缀 */
  key: 'terms' | 'privacy'
  /** 标题 i18n key（见 locales 的 authPage.agreementTerms / agreementPrivacy） */
  titleKey: string
  /** 正文段落；每项是一个自然段 */
  paragraphs: string[]
}

/** 是否是占位内容（true 时弹窗顶部会显示黄色提示条） */
export const AGREEMENT_PLACEHOLDER = true

/** 条款版本号，留空则不显示 */
export const AGREEMENT_VERSION = ''

/** 三语文档表；key 与顺序即页面上的链接顺序 */
export const AGREEMENT_DOCS: AgreementDoc[] = [
  {
    key: 'terms',
    titleKey: 'authPage.agreementTerms',
    paragraphs: [
      '【佔位內容】此處為《用戶協議》正文位置。',
      '正式條款尚未由客戶／法務提供。條款內容通常包含：服務範圍、帳戶使用規範、資料準確性責任、禁止行為、服務變更與終止、免責聲明、爭議解決方式等。',
      '前端已實現：註冊頁勾選校驗、點擊鏈接彈窗查看、三語標題、版本號展示。正式文本到位後，僅需替換本文件，頁面代碼無需改動。'
    ]
  },
  {
    key: 'privacy',
    titleKey: 'authPage.agreementPrivacy',
    paragraphs: [
      '【佔位內容】此處為《隱私政策》正文位置。',
      '正式條款尚未由客戶／法務提供。條款內容通常包含：收集哪些個人資料（帳號、郵箱、電話）、收集目的與法律依據、保存期限、資料共享對象、查閱與更正權利、聯絡方式等。',
      '提醒：本系統會使用「郵箱驗證碼」完成註冊與密碼重設，即會收集並使用用戶郵箱，這部分必須在隱私政策中明確說明。'
    ]
  }
]

/** 按 key 取某一份文档 */
export function getAgreementDoc(key: AgreementDoc['key']): AgreementDoc | undefined {
  return AGREEMENT_DOCS.find((doc) => doc.key === key)
}
