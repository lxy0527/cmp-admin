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
        <el-form-item label="Email" prop="Email" :error="emailError">
          <el-input
            v-model="form.Email"
            size="large"
            placeholder="name@example.com"
            :prefix-icon="Message"
            @blur="onEmailBlur"
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

      <!-- 用户协议勾选：条款正文在 src/config/agreement.ts，点击链接弹窗查看 -->
      <div class="agreement-row">
        <el-checkbox v-model="agreed" size="small">
          <span class="agreement-text">{{ t('authPage.agreementAgree') }}</span>
        </el-checkbox>
        <button type="button" class="agreement-link" @click="openAgreement('terms')">
          {{ t('authPage.agreementTerms') }}
        </button>
        <span class="agreement-text">{{ t('authPage.agreementAnd') }}</span>
        <button type="button" class="agreement-link" @click="openAgreement('privacy')">
          {{ t('authPage.agreementPrivacy') }}
        </button>
      </div>

      <el-button class="auth-btn" type="primary" size="large" :loading="loading" @click="handleSubmit">
        {{ t('authPage.submitRegister') }}
      </el-button>

      <div class="auth-links">
        <el-button link type="primary" @click="router.push('/login')">
          {{ t('authPage.backToLogin') }}
        </el-button>
      </div>
    </div>

    <!-- 协议正文弹窗 -->
    <el-dialog v-model="agreementVisible" :title="agreementTitle" width="640px" class="agreement-dialog">
      <el-alert
        v-if="AGREEMENT_PLACEHOLDER"
        type="warning"
        :closable="false"
        show-icon
        class="agreement-alert"
        :title="t('authPage.agreementPlaceholder')"
      />
      <div class="agreement-body">
        <p v-for="(para, i) in agreementParagraphs" :key="i">{{ para }}</p>
      </div>
      <template #footer>
        <span v-if="AGREEMENT_VERSION" class="agreement-version">
          {{ t('authPage.agreementVersion') }} {{ AGREEMENT_VERSION }}
        </span>
        <el-button type="primary" @click="agreementVisible = false">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
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
import { AGREEMENT_PLACEHOLDER, AGREEMENT_VERSION, getAgreementDoc } from '@/config/agreement'
import { checkAccountApi, checkEmailAvailableApi, registerApi, sendVerifyCodeApi } from '@/api/auth'
import type { AccountCheck } from '@/api/auth'

defineOptions({ name: 'RegisterView' })

const router = useRouter()
const { t } = useI18n()

const formRef = ref<FormInstance>()
const loading = ref(false)
/** 账号占用检查结果：null=还没查，true=可注册，false=被占用/保留 */
const accountState = ref<AccountCheck | null>(null)

const form = reactive({
  UserName: '',
  Email: '',
  Password: '',
  ConfirmPassword: '',
  Tele: '',
  VerifyCode: ''
})

/* ---------------- 邮箱唯一性（一个邮箱只能绑一个账号） ---------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 该邮箱是否已被占用（true 时表单下方直接飘红，并禁掉发码/提交） */
const emailTaken = ref(false)
const checkingEmail = ref(false)
const emailError = computed(() => (emailTaken.value ? t('authPage.emailTaken') : ''))

/** true = 可用 */
async function checkEmail(): Promise<boolean> {
  const email = form.Email.trim()
  emailTaken.value = false
  if (!email || !EMAIL_RE.test(email)) return true
  checkingEmail.value = true
  try {
    const ok = await checkEmailAvailableApi(email)
    emailTaken.value = !ok
    if (!ok) {
      // 邮箱已占用 → 之前拿的 token 和验证码都作废，避免走到提交才失败
      verifyToken.value = ''
      form.VerifyCode = ''
    }
    return ok
  } catch {
    // 查重只是体验优化，查不了就放行 —— 后端提交时才是真正的把关
    return true
  } finally {
    checkingEmail.value = false
  }
}

/** 失焦即查：用户一填完邮箱就知道能不能用，不用等点发码 */
async function onEmailBlur() {
  await checkEmail()
}

/* ---------------- 用户协议 ---------------- */
/** 是否勾选「已阅读并同意」—— 不勾不许提交 */
const agreed = ref(false)
const agreementVisible = ref(false)
const agreementKey = ref<'terms' | 'privacy'>('terms')
const agreementDoc = computed(() => getAgreementDoc(agreementKey.value))
const agreementTitle = computed(() => (agreementDoc.value ? t(agreementDoc.value.titleKey) : ''))
const agreementParagraphs = computed(() => agreementDoc.value?.paragraphs ?? [])

function openAgreement(key: 'terms' | 'privacy') {
  agreementKey.value = key
  agreementVisible.value = true
}

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
    // 邮箱一改，"已占用"的结论就失效了，等下一次失焦重新查
    emailTaken.value = false
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
    // 发码前再确认一次邮箱没被占用：已注册的邮箱**绝不能白收一封验证码邮件**
    // （浪费额度 + 触发风控 + 等于告诉对方"这邮箱注册过"）
    if (!(await checkEmail())) {
      ElMessage.error(t('authPage.emailTaken'))
      return
    }
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

/**
 * 失焦时校验账号能不能用来注册
 * 两个判断合在一起：是否已被注册（/userSingle）+ 是否系统保留名（/userUnRegister）
 */
async function checkAccount() {
  const name = form.UserName.trim()
  if (!name) {
    accountState.value = null
    return
  }
  try {
    accountState.value = await checkAccountApi(name)
    if (accountState.value === 'taken') ElMessage.warning(t('authPage.accountTaken'))
    if (accountState.value === 'reserved') ElMessage.warning(t('authPage.accountReserved'))
  } catch {
    // 校验失败不阻断提交：交给注册接口自己判断（后端才是最终裁决）
    accountState.value = null
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  // 协议没勾就别提交（勾选框不在 el-form 里，单独挡一道）
  if (!agreed.value) {
    ElMessage.warning(t('authPage.agreementRequired'))
    return
  }
  if (accountState.value === 'taken') {
    ElMessage.warning(t('authPage.accountTaken'))
    return
  }
  if (accountState.value === 'reserved') {
    ElMessage.warning(t('authPage.accountReserved'))
    return
  }
  // 邮箱被别人占了就别往下走（后端提交时也会拒，这里先把话说明白）
  if (emailTaken.value) {
    ElMessage.warning(t('authPage.emailTaken'))
    return
  }
  if (!(await checkEmail())) {
    ElMessage.warning(t('authPage.emailTaken'))
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

/* ---- 用户协议勾选行 ---- */
.agreement-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin: 2px 0 10px;
  font-size: 13px;
  line-height: 1.5;

  :deep(.el-checkbox) {
    height: auto;
    margin-right: 0;
  }

  :deep(.el-checkbox__label) {
    padding-left: 6px;
    font-size: 13px;
  }
}

.agreement-text {
  color: var(--el-text-color-regular);
}

.agreement-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--el-color-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  line-height: 1.5;

  &:hover {
    text-decoration: underline;
  }
}

/* ---- 协议正文弹窗 ---- */
.agreement-alert {
  margin-bottom: 14px;
}

.agreement-body {
  max-height: 52vh;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.85;
  color: var(--el-text-color-regular);

  p {
    margin: 0 0 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.agreement-version {
  margin-right: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
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
