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
 * 接口是**真实存在**的（已核对文档）：
 *   - POST /api/userUnRegister  校验账号是否被系统保留（Valid === 'Yes' 才能注册）
 *   - POST /api/userRegister    注册（文档原话："超级管理员添加账号也通用"）
 *
 * ⚠️ 管理后台一般不该开放公众自助注册（账号应由管理员创建）。
 *    这里按需求方要求提供，但真正的鉴权/风控必须由后端决定要不要放行。
 */
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Iphone, Lock, Message, User } from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import { checkAccountAvailableApi, registerApi } from '@/api/auth'

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
  Tele: ''
})

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

  loading.value = true
  try {
    await registerApi({
      UserName: form.UserName.trim(),
      Email: form.Email.trim(),
      Password: form.Password,
      Tele: form.Tele.trim()
    })
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
