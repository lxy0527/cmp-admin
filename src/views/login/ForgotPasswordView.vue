<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <AppLogo size="large" />
      </div>
      <h1 class="auth-title">{{ t('authPage.changePwdTitle') }}</h1>
      <p class="auth-sub">{{ t('authPage.changePwdSubtitle') }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="Email" prop="Email">
          <el-input
            v-model="form.Email"
            size="large"
            placeholder="name@example.com"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item :label="t('authPage.verifyCode')" prop="VerifyCode">
          <div class="code-row">
            <el-input
              v-model="form.VerifyCode"
              size="large"
              maxlength="6"
              :placeholder="t('authPage.verifyCodePlaceholder')"
              :prefix-icon="Key"
            />
            <el-button size="large" :disabled="codeCooldown > 0" :loading="sending" @click="sendCode">
              {{ codeCooldown > 0 ? `${codeCooldown}s` : t('authPage.sendCode') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('authPage.newPassword')" prop="Password">
          <el-input
            v-model="form.Password"
            type="password"
            size="large"
            show-password
            :placeholder="t('authPage.passwordRequired')"
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item :label="t('authPage.confirmPassword')" prop="ConfirmPassword">
          <el-input
            v-model="form.ConfirmPassword"
            type="password"
            size="large"
            show-password
            :placeholder="t('authPage.passwordRequired')"
            :prefix-icon="Lock"
          />
        </el-form-item>
      </el-form>

      <el-button class="auth-btn" type="primary" size="large" :loading="loading" @click="handleSubmit">
        {{ t('authPage.submitChangePwd') }}
      </el-button>

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
 * 修改密码 / 找回密码（同一个流程）
 * ============================================================
 * 2026-10-19 后端新增，接口：`POST /api/changePassword`
 *
 * 两步（跟注册页一致）：
 *   ① POST /api/email { Email, Scene: 'ChangePassword' }
 *      → 后端发验证码，返回**一次性 token（10 分钟、只能用一次）**
 *   ② POST /api/changePassword，请求头 `Authorization: Bearer <一次性token>`
 *      body 带 VerifyCode + 新密码
 *
 * 字段已按文档确认：Email + Password（新密码）+ VerifyCode，头里带一次性 token。
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Key, Lock, Message } from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import { changePasswordApi, sendVerifyCodeApi } from '@/api/auth'

defineOptions({ name: 'ForgotPasswordView' })

const router = useRouter()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
const sending = ref(false)
const codeCooldown = ref(0)
/** 发码拿到的一次性 token；提交时放进 Authorization 头 */
const verifyToken = ref('')
let cooldownTimer: number | undefined

const form = reactive({
  Email: '',
  VerifyCode: '',
  Password: '',
  ConfirmPassword: ''
})

function startCooldown(seconds = 60) {
  codeCooldown.value = seconds
  if (cooldownTimer) window.clearInterval(cooldownTimer)
  cooldownTimer = window.setInterval(() => {
    codeCooldown.value -= 1
    if (codeCooldown.value <= 0 && cooldownTimer) {
      window.clearInterval(cooldownTimer)
      cooldownTimer = undefined
    }
  }, 1000)
}

onBeforeUnmount(() => {
  if (cooldownTimer) window.clearInterval(cooldownTimer)
})

/** 邮箱改了，之前的 token 就作废（否则 token 和邮箱不是一对） */
watch(
  () => form.Email,
  (now, before) => {
    if (!verifyToken.value) return
    if ((now || '').trim().toLowerCase() !== (before || '').trim().toLowerCase()) {
      verifyToken.value = ''
      form.VerifyCode = ''
    }
  }
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const rules = computed<FormRules>(() => ({
  Email: [
    { required: true, message: t('authPage.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('authPage.emailInvalid'), trigger: 'blur' }
  ],
  VerifyCode: [
    { required: true, message: t('authPage.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('authPage.verifyCodeLength'), trigger: 'blur' }
  ],
  Password: [
    { required: true, message: t('authPage.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('authPage.passwordTooShort'), trigger: 'blur' }
  ],
  ConfirmPassword: [
    { required: true, message: t('authPage.passwordRequired'), trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (value !== form.Password) callback(new Error(t('authPage.passwordMismatch')))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}))

async function sendCode() {
  const email = form.Email.trim()
  if (!email) {
    ElMessage.warning(t('authPage.emailRequired'))
    return
  }
  if (!EMAIL_RE.test(email)) {
    ElMessage.warning(t('authPage.emailInvalid'))
    return
  }
  sending.value = true
  try {
    verifyToken.value = await sendVerifyCodeApi(email, 'ChangePassword')
    ElMessage.success(t('authPage.codeSent'))
    startCooldown(60)
  } catch (e) {
    ElMessage.error((e as Error)?.message || t('authPage.codeSendFailed'))
  } finally {
    sending.value = false
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!verifyToken.value) {
    ElMessage.warning(t('authPage.sendCodeFirst'))
    return
  }

  loading.value = true
  try {
    await changePasswordApi(
      {
        Email: form.Email.trim(),
        Password: form.Password,
        VerifyCode: form.VerifyCode.trim()
      },
      verifyToken.value
    )
    ElMessage.success(t('authPage.changePwdSuccess'))
    router.replace('/login')
  } catch (e) {
    ElMessage.error((e as Error)?.message || t('authPage.changePwdFailed'))
  } finally {
    loading.value = false
  }
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
  margin: 6px 0 20px;
  font-size: 12px;
  text-align: center;
  color: $text-secondary;
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;

  :deep(.el-input) {
    flex: 1;
  }

  :deep(.el-button) {
    flex: none;
    width: 104px;
  }
}

.auth-btn {
  width: 100%;
  margin-top: 4px;
}

.auth-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
  font-size: 12px;
  color: $text-secondary;
}
</style>
