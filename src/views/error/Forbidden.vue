<template>
  <div class="forbidden">
    <div class="code">{{ t('forbidden.code') }}</div>
    <p class="msg">{{ t('forbidden.title') }}</p>
    <p class="hint">{{ t('forbidden.hint') }}</p>
    <p class="hint">{{ t('forbidden.reloginHint') }}</p>
    <div class="actions">
      <el-button type="primary" @click="relogin">{{ t('forbidden.relogin') }}</el-button>
      <el-button @click="router.replace('/dashboard')">{{ t('forbidden.backHome') }}</el-button>
      <el-button @click="back">{{ t('forbidden.backPrev') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 403 独立落地页。
 *
 * 后端 2026-10-21 的要求：「没权限就重定向到一个单独独立落地页，
 * 让其重新登入提权」。这里就是那个落地页：
 *   - 「切換帳號重新登入」→ 清掉本地登录态 → 回登录页（带 ?redirect= 回跳原页面）
 *   - 「返回首頁 / 返回上一頁」→ 给不改权限的人一条退路
 *
 * 注意：**只有「登录失效」才自动踢回登录页**；「已登录但没权限」落在本页，
 * 否则普通账号会被反复踢到登录页、登完还是没权限，死循环。
 */
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/user'

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()

/** 上一页可能也是无权页面，失败了就退回首页 */
function back(): void {
  if (window.history.length > 1) router.back()
  else router.replace('/dashboard')
}

/** 清登录态 → 回登录页，登录成功后回到当前这个页面（若权限已补上就能进） */
function relogin(): void {
  const current = router.currentRoute.value
  const from = typeof current.query.from === 'string' ? current.query.from : '/dashboard'
  userStore.reset()
  router.replace({ path: '/login', query: { redirect: from } })
}
</script>

<style scoped lang="scss">
/* 独立落地页：这个页面在主框架之外渲染，所以自己铺满整屏 */
.forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100vh;
  padding: 60px 16px;
  box-sizing: border-box;
  text-align: center;
  background: $page-bg;
}

.code {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  color: $warning;
}

.msg {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: $text-main;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: $text-secondary;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
</style>
