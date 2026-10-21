<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <AppLogo size="large" />
      </div>
      <h1 class="auth-title">{{ t('authPage.registerTitle') }}</h1>
      <p class="auth-sub">{{ t('authPage.registerSubtitle') }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item :label="t('authPage.account')" prop="UserName">
          <el-input
            v-model="form.UserName"
            size="large"
            :placeholder="t('authPage.accountRequired')"
            :prefix-icon="User"
            @blur="checkAccount"
          />
        </el-form-item>
        <el-form-item label="Email" prop="Email">
          <el-input
            v-model="form.Email"
            size="large"
            placeholder="name@example.com"
            :prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item :label="t('authPage.password')" prop="Password">
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
        <el-form-item :label="t('authPage.tele')">
          <el-input v-model="form.Tele" size="large" :placeholder="t('authPage.tele')" :prefix-icon="Iphone" />
        </el-form-item>

        <!--
          验证码：2026-10-19 后端新增。
          流程：填邮箱 → 点「發送驗證碼」→ 后端发信并返回一次性 token（10 分钟、只能用一次）
                → 填验证码 → 提交注册（请求头带那个 token）
        -->
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
      </el-form>

      <el-button class="auth-btn" type="primary" size="large" :loading="loading" @click="handleSubmit">
        {{ t('authPage.submitRegister') }}
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
 * 注册页
 * ============================================================
 * 2026-10-19 后端新增「邮箱验证码」机制，注册变成两步：
 *
 *   ① POST /api/email { Email, Scene: 'Register' }
 *      → 后端用自己配置的 SMTP 发验证码，**返回一次性 token（10 分钟、只能用一次）**
 *   ② POST /api/userRegister，请求头 `Authorization: Bearer <一次性token>`，
 *      body 带 VerifyCode
 *
 * 所以页面要管住三件事：
 *   - 没发码 / 没拿到 token → 不许提交
 *   - 邮箱改了就作废之前那个 token（否则 token 和邮箱不是一对）
 *   - 60 秒倒计时防止连点（文档明说测试太频繁会被风控拉黑）
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Iphone, Key, Lock, Message, User } from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import { checkAccountAvailableApi, registerApi, sendVerifyCodeApi } from '@/api/auth'

defineOptions({ name: 'RegisterView' })

const router = useRouter()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
/** 账号占用检查结果：null=还没查，true=可注册，false=被占用/保留 */
const accountAvailable = ref<boolean | null>(null)

const form = reactive({
  UserName: '',
  Email: '',
  Password: '',
  ConfirmPassword: '',
  Tele: '',
  VerifyCode: ''
})

/* ---------------- 验证码 ---------------- */
const sending = ref(false)
/** 倒计时秒数（>0 时发送按钮禁用） */
const codeCooldown = ref(0)
/** 发码拿到的一次性 token；提交时放进 Authorization 头 */
const verifyToken = ref('')
let cooldownTimer: number | undefined

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

/**
 * 邮箱一改，之前拿到的 token 就作废。
 * 否则会出现"用 A 邮箱拿的 token 去给 B 邮箱注册"—— 后端会拒，但不如前端先清掉。
 */
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

async function sendCode() {
  const email = form.Email.trim()
  if (!email) {
    ElMessage.warning(t('authPage.emailRequired'))
    return
  }
  // 先过一遍邮箱格式校验，别白跑一次接口（也免得频繁请求触发风控）
  const emailRule = rules.value.Email as Array<{ type?: string }>
  if (emailRule?.some((r) => r.type === 'email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning(t('authPage.emailInvalid'))
    return
  }

  sending.value = true
  try {
    verifyToken.value = await sendVerifyCodeApi(email, 'Register')
    ElMessage.success(t('authPage.codeSent'))
    startCooldown(60)
  } catch (e) {
    ElMessage.error((e as Error)?.message || t('authPage.codeSendFailed'))
  } finally {
    sending.value = false
  }
}

const rules = computed<FormRules>(() => ({
  UserName: [{ required: true, message: t('authPage.accountRequired'), trigger: 'blur' }],
  Email: [
    { required: true, message: t('authPage.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('authPage.emailInvalid'), trigger: 'blur' }
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
  ],
  VerifyCode: [
    { required: true, message: t('authPage.verifyCodeRequired'), trigger: 'blur' },
    { len: 6, message: t('authPage.verifyCodeLength'), trigger: 'blur' }
  ]
}))

/** 失焦时校验账号是否可用（调用 /userUnRegister） */
async function checkAccount() {
  const name = form.UserName.trim()
  if (!name) {
    accountAvailable.value = null
    return
  }
  try {
    accountAvailable.value = await checkAccountAvailableApi(name)
    if (!accountAvailable.value) ElMessage.warning(t('authPage.accountReserved'))
  } catch {
    // 校验失败不阻断提交：交给注册接口自己判断（后端才是最终裁决）
    accountAvailable.value = null
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (accountAvailable.value === false) {
    ElMessage.warning(t('authPage.accountReserved'))
    return
  }
  // 必须先拿到发码返回的 token，否则后端一定拒（而且这是后端的硬要求）
  if (!verifyToken.value) {
    ElMessage.warning(t('authPage.sendCodeFirst'))
    return
  }

  loading.value = true
  try {
    await registerApi(
      {
        UserName: form.UserName.trim(),
        Email: form.Email.trim(),
        Password: form.Password,
        Tele: form.Tele.trim(),
        VerifyCode: form.VerifyCode.trim()
      },
      verifyToken.value
    )
    ElMessage.success(t('authPage.registerSuccess'))
    router.replace('/login')
  } catch (e) {
    ElMessage.error((e as Error)?.message || t('authPage.registerFailed'))
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
