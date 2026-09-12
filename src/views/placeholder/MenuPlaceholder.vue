<template>
  <div class="page">
    <div class="page-card placeholder">
      <div class="ph-icon">
        <el-icon><Tools /></el-icon>
      </div>
      <h2 class="ph-title">{{ title }}</h2>
      <p class="ph-desc">{{ desc }}</p>
      <p class="ph-tip">该页面暂未开发，等需求/接口明确后再补 —— 当前为壳子占位页</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tools } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    title?: string
    desc?: string
  }>(),
  { title: '页面开发中', desc: '' }
)
</script>

<style scoped lang="scss">
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: calc(100vh - 160px);
  text-align: center;
}

.ph-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  font-size: 30px;
  color: $primary;
  background: rgba(61, 139, 253, 0.1);
}

.ph-title {
  margin: 6px 0 0;
  font-size: 17px;
  font-weight: 600;
  color: $text-main;
}

.ph-desc {
  margin: 0;
  font-size: 13px;
  color: $text-secondary;
}

.ph-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #a8b0bd;
}
</style>
