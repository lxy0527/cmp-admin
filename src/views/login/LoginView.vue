<template>
  <div class="login-page">
    <!-- ---------- 背景：纯 CSS 搭一个近似设计图的浅蓝科技城市 ---------- -->
    <div class="bg">
      <div class="bg-glow" />

      <!-- 远景楼群（带模糊） -->
      <div class="skyline skyline--far">
        <span v-for="(b, i) in farBuildings" :key="`f${i}`" class="bld" :style="b" />
      </div>

      <!-- 近景主体楼群 -->
      <div class="skyline skyline--near">
        <span v-for="(b, i) in nearBuildings" :key="`n${i}`" class="bld" :style="b">
          <i class="bld-top" />
        </span>
      </div>

      <!-- 地面网格 -->
      <div class="ground" />

      <!-- 右侧：悬浮平台 -->
      <div class="platform">
        <div class="plat-plate" />
        <div class="plat-thickness" />
      </div>

      <!-- 右侧：全息大楼 -->
      <div class="tower">
        <span class="tower-roof" />
        <span class="tower-window" />
        <span class="tower-runner" />
      </div>

      <!-- 云朵 -->
      <div class="cloud">
        <span class="cloud-puff p1" />
        <span class="cloud-puff p2" />
        <span class="cloud-puff p3" />
      </div>
    </div>

    <!-- ---------- 登录卡片 ---------- -->
    <div class="login-card">
      <div class="card-logo">
        <AppLogo size="large" />
      </div>
      <div class="login-title">系统登录</div>

      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent>
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            size="large"
            placeholder="用户名"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            size="large"
            placeholder="密码"
            show-password
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>

      <el-button class="login-btn" type="primary" size="large" :loading="loading" @click="handleLogin">
        登录
      </el-button>

      <p class="card-tip">演示账号：admin / 123456</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456'
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login({ ...form })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    ElMessage.error((e as Error).message || '登录失败')
  } finally {
    loading.value = false
  }
}

/** 随机楼群：只在组件初始化时算一次，位置/尺寸错落一点更像城市 */
type Building = Record<string, string>

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min))

const TONES = [
  'linear-gradient(180deg, #f2f7ff 0%, #dbe6f8 55%, #c6d7ef 100%)',
  'linear-gradient(180deg, #edf4ff 0%, #d3e1f6 60%, #bccfea 100%)',
  'linear-gradient(180deg, #f6faff 0%, #e2ebfa 58%, #cddbf1 100%)'
]

const farBuildings: Building[] = Array.from({ length: 18 }, () => ({
  left: `${rand(0, 60)}%`,
  width: `${rand(3, 8)}%`,
  height: `${rand(10, 30)}%`,
  background: TONES[rand(0, 2)],
  opacity: '0.75'
}))

const nearBuildings: Building[] = Array.from({ length: 14 }, () => ({
  left: `${rand(0, 52)}%`,
  width: `${rand(5, 10)}%`,
  height: `${rand(18, 52)}%`,
  background: TONES[rand(0, 2)],
  opacity: '1'
}))
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(160deg, #f6faff 0%, #e9f1fd 42%, #e2ebfb 100%);
}

/* ---------------- 背景 ---------------- */
.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(58% 52% at 10% 12%, rgba(255, 255, 255, 0.98), transparent 72%),
    radial-gradient(42% 46% at 72% 26%, rgba(150, 195, 255, 0.32), transparent 72%),
    radial-gradient(34% 30% at 88% 62%, rgba(120, 180, 255, 0.22), transparent 70%);
}

.skyline {
  position: absolute;
  inset: 0;
}

.bld {
  position: absolute;
  bottom: 26%;
  border-radius: 3px 3px 1px 1px;
  box-shadow:
    0 14px 26px rgba(110, 150, 205, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.75);
}

.bld-top {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px 3px 0 0;
}

.skyline--far .bld {
  bottom: 32%;
  filter: blur(1.6px);
}

.ground {
  position: absolute;
  left: -10%;
  bottom: -6%;
  width: 120%;
  height: 46%;
  background:
    repeating-linear-gradient(90deg, rgba(170, 200, 240, 0.5) 0 1px, transparent 1px 56px),
    repeating-linear-gradient(0deg, rgba(170, 200, 240, 0.42) 0 1px, transparent 1px 42px);
  transform: perspective(520px) rotateX(64deg);
  transform-origin: bottom center;
  mask-image: linear-gradient(180deg, transparent 0%, #000 65%);
  opacity: 0.9;
}

/* ---------------- 悬浮平台 ---------------- */
.platform {
  position: absolute;
  right: 11%;
  bottom: 15%;
  width: 360px;
  height: 130px;
}

.plat-plate {
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, rgba(215, 233, 255, 0.95), rgba(176, 209, 250, 0.9));
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 46px rgba(88, 145, 220, 0.24);
  transform: perspective(340px) rotateX(54deg) rotateZ(45deg);
}

.plat-thickness {
  position: absolute;
  left: 12%;
  right: 12%;
  bottom: -14px;
  height: 26px;
  background: linear-gradient(180deg, rgba(150, 195, 250, 0.55), rgba(150, 195, 250, 0));
  border-radius: 14px;
  filter: blur(3px);
}

/* ---------------- 全息大楼 ---------------- */
.tower {
  position: absolute;
  right: 15%;
  bottom: 24%;
  width: 170px;
  height: 300px;
  border: 2px solid rgba(94, 176, 255, 0.9);
  border-radius: 3px 3px 0 0;
  background: linear-gradient(180deg, rgba(120, 195, 255, 0.42), rgba(70, 155, 250, 0.62));
  box-shadow:
    0 0 20px rgba(70, 155, 250, 0.55),
    0 0 60px rgba(120, 190, 255, 0.35),
    inset 0 0 30px rgba(255, 255, 255, 0.6);
  overflow: hidden;
}

.tower-roof {
  position: absolute;
  left: 24%;
  top: -12px;
  width: 52%;
  height: 12px;
  border: 2px solid rgba(94, 176, 255, 0.85);
  border-bottom: 0;
  background: rgba(180, 220, 255, 0.5);
  border-radius: 3px 3px 0 0;
}

/* 楼体上的"玻璃幕墙"：竖向密 + 横向疏，避免看起来像网格纸 */
.tower-window {
  position: absolute;
  inset: 6% 10%;
  background:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0 1px, transparent 1px 9px),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.24) 0 1px, transparent 1px 34px);
  opacity: 0.85;
}

.tower-runner {
  position: absolute;
  left: 0;
  right: 0;
  height: 46px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: towerScan 5s linear infinite;
}

@keyframes towerScan {
  0% {
    top: -46px;
  }
  100% {
    top: 100%;
  }
}

/* ---------------- 云朵 ---------------- */
.cloud {
  position: absolute;
  right: 3.5%;
  top: 47%;
  width: 120px;
  height: 64px;
  filter: blur(5px);
  opacity: 0.95;

  .cloud-puff {
    position: absolute;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 32%, #8fc0f8, #6aa8f2 62%, rgba(140, 190, 250, 0.35) 100%);
  }

  .p1 {
    left: 6%;
    top: 26%;
    width: 54%;
    height: 74%;
  }

  .p2 {
    left: 34%;
    top: 4%;
    width: 56%;
    height: 92%;
  }

  .p3 {
    left: 54%;
    top: 40%;
    width: 44%;
    height: 60%;
  }
}

/* ---------------- 登录卡片 ---------------- */
.login-card {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 300px;
  padding: 26px 22px 18px;
  transform: translate(-50%, -54%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 14px 44px rgba(70, 120, 200, 0.18);
  /* 用 flex 居中，避免受外层 flex 盒的 text-align 影响 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-card :deep(.el-form) {
  width: 100%;
  margin-top: 2px;
}

.card-logo {
  margin-bottom: 8px;
}

.login-title {
  width: 100%;
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  color: #303133;
  text-align: center;
}

.login-btn {
  width: 100%;
  margin-top: 2px;
  letter-spacing: 2px;
}

.card-tip {
  margin: 12px 0 0;
  font-size: 12px;
  color: #a0a6b0;
  text-align: center;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dfe5ee inset;
}

:deep(.el-input__inner) {
  font-size: 13px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
