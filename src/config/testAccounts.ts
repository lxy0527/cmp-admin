/**
 * 测试账号提示（登录页用）
 * ------------------------------------------------------------
 * 真实模式（连真后端）下，登录框下面会列出这几个可用账号，
 * 方便后端同事/客户直接拿来试，不用来问密码。
 *
 * ⚠️ 这些是**明文账号密码**，会被打进前端产物（dist 里能直接搜到）。
 *    当前项目还在早期内部联调阶段，按"怎么方便怎么来"先这么做。
 *    上线给最终客户前，把 SHOW_TEST_ACCOUNTS 改成 false 即可，
 *    页面逻辑不用动（会整块消失）。
 *
 * 想临时关掉：`SHOW_TEST_ACCOUNTS = false`，或删掉下面数组里的条目。
 */
export const SHOW_TEST_ACCOUNTS = true

export interface TestAccount {
  /** 登录账号 */
  userName: string
  /** 登录密码 */
  password: string
  /** 展示用的角色说明（繁中，与全站默认语言一致） */
  roleLabel: string
}

export const TEST_ACCOUNTS: TestAccount[] = [
  { userName: 'admin', password: 'vision**2026', roleLabel: '管理員（可看全部模組）' },
  { userName: 'user01', password: 'user12345', roleLabel: '普通帳號（只看自己資料）' }
]
