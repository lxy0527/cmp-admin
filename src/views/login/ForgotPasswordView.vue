<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <AppLogo size="large" />
      </div>
      <h1 class="auth-title">{{ t('authPage.forgotTitle') }}</h1>
      <p class="auth-sub">{{ t('authPage.forgotSubtitle') }}</p>

      <!--
        这里刻意把「后端没有这个接口」摆在最上面。
        不写清楚的话，用户填完点提交、等半天收不到邮件，只会以为系统坏了。
      -->
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="auth-alert"
        :title="t('authPage.forgotNoApi')"
      />

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item :label="t('authPage.account')" prop="account">
          <el-input
            v-model="form.account"
            size="large"
            :placeholder="t('authPage.accountRequired')"
            :prefix-icon="User"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>
      </el-form>

      <el-button class="auth-btn" type="primary" size="large" :loading="loading" @click="handleSubmit">
        {{ t('authPage.submitForgot') }}
      </el-button>

      <p class="auth-hint">{{ t('authPage.forgotHint') }}</p>

      <div class="auth-links">
        <el-button link type="primary" @click="router.push('/login')">
          {{ t('authPage.backToLogin') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 找回密码页
 * ============================================================
 * ⚠️ 这页**没有可调用的接口**（已核对接口文档：找回/忘记/重置密码 四个关键词 0 命中）。
 *    旧站后台有个未文档化的 `/cmp/account/password-reset`，新接口没给。
 *
 * 所以本页的行为是**诚实的**：
 *   - 顶部明确告知"后端未提供此接口、本页仅界面预留、不会发邮件"
 *   - 提交只给出"请联系管理员"的结论，**不假装发送成功**
 *
 * 后端一旦提供接口（比如 POST /api/userForgotPassword），把 handleSubmit 里的
 * message 换成真实请求即可，页面结构不用动。
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { User } from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'

defineOptions({ name: 'ForgotPasswordView' })

const router = useRouter()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ account: '' })

const rules = computed<FormRules>(() => ({
  account: [{ required: true, message: t('authPage.accountRequired'), trigger: 'blur' }]
}))

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  // 故意加一点延迟，让"提交"有反馈感，而不是瞬间弹提示
  await new Promise((r) => setTimeout(r, 300))
  loading.value = false

  ElMessage.warning(t('authPage.forgotSubmitted'))
}
</script>

<style scoped lang="scss">
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 32px 16px;
  background:
    radial-gradient(1000px 500px at 15% 10%, #eaf2ff 0%, transparent 60%),
    radial-gradient(900px 500px at 85% 90%, #e8f7ff 0%, transparent 60%), #f5f8fd;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 30px 24px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(22, 55, 110, 0.1);
}

.auth-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}

.auth-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: $text-main;
}

.auth-sub {
  margin: 6px 0 18px;
  font-size: 12px;
  text-align: center;
  color: $text-secondary;
}

.auth-alert {
  margin-bottom: 16px;
}

.auth-btn {
  width: 100%;
  margin-top: 4px;
}

.auth-hint {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
  color: $text-secondary;
}

.auth-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: $text-secondary;
}
</style>
