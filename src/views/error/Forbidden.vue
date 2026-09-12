<template>
  <div class="forbidden">
    <div class="code">403</div>
    <p class="msg">你没有访问该页面的权限</p>
    <p class="hint">如确需访问，请联系管理员为你的账号分配对应角色</p>
    <div class="actions">
      <el-button type="primary" @click="router.replace('/dashboard')">返回首页</el-button>
      <el-button @click="back">返回上一页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

/** 上一页可能也是无权页面，失败了就退回首页 */
function back() {
  if (window.history.length > 1) router.back()
  else router.replace('/dashboard')
}
</script>

<style scoped lang="scss">
.forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 320px;
  padding: 60px 16px;
  text-align: center;
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
  margin-top: 10px;
}
</style>
