<template>
  <!--
    演示模式横幅（关不掉，故意的）
    ============================================================
    目的只有一个：**绝不能让看的人误以为这些是真实数据**。
    公网部署（Cloudflare Pages）访问不到内网接口，所以线上是内置示例数据；
    后端给了公网地址后，把 .env.production 的 VITE_DEMO_MODE 改成 false，
    这条横幅会自动消失。
  -->
  <div v-if="DEMO_MODE" class="demo-banner">
    <el-icon class="demo-icon"><WarningFilled /></el-icon>
    <span class="demo-text">{{ t('demo.banner') }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { WarningFilled } from '@element-plus/icons-vue'
import { DEMO_MODE } from '@/demo'

const { t } = useI18n()
</script>

<style scoped lang="scss">
.demo-banner {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: #7a4a00;
  background: repeating-linear-gradient(
    135deg,
    #fff4d6,
    #fff4d6 12px,
    #ffe8b0 12px,
    #ffe8b0 24px
  );
  border-bottom: 1px solid #f0c36d;
  letter-spacing: 0.2px;
  user-select: none;
}

.demo-icon {
  color: #d48806;
}

.demo-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
