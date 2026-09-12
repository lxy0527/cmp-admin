<template>
  <!--
    菜单图标
    设计图上是"彩色小方块"，但图标资源还没有，所以默认画一个小圆点。
    以后不管是：后端下发图标名、还是设计给 svg/png，只要改这一个组件即可。
  -->
  <span v-if="!icon" class="menu-dot" :class="{ active }" />

  <span v-else class="menu-icon chip" :class="[`chip--${icon}`, { active }]">
    <el-icon><component :is="resolveIcon(icon)" /></el-icon>
  </span>
</template>

<script setup lang="ts">
/**
 * 图标解析器（**唯一的图标映射点**）
 * 现在只支持内置的几个名字 → Element Plus 图标；
 * 以后接图标库/后端图标名，只改 ICON_MAP 或 resolveIcon。
 */
import {
  DataLine,
  Monitor,
  Odometer,
  Setting,
  Tickets,
  Warning
} from '@element-plus/icons-vue'

defineProps<{
  /** 图标标识：内置名（data/setting/monitor/...）或后续的图标库 key */
  icon?: string
  /** 是否高亮（当前选中/所在分组） */
  active?: boolean
}>()

const ICON_MAP: Record<string, unknown> = {
  data: DataLine,
  setting: Setting,
  monitor: Monitor,
  dashboard: Odometer,
  permit: Tickets,
  alarm: Warning
}

function resolveIcon(name: string) {
  return ICON_MAP[name] || DataLine
}
</script>

<style scoped lang="scss">
.menu-dot {
  flex: none;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c8d2e3;

  &.active {
    background: $primary;
  }
}

.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, #a9bfe0, #8ba6cd);

  &.active {
    background: linear-gradient(135deg, #5aa0ff, #2f6fe0);
  }

  &--data {
    background: linear-gradient(135deg, #4f9dff, #2f6fe0);
  }

  &--setting {
    background: linear-gradient(135deg, #ff7a59, #e0451f);
  }

  &--monitor {
    background: linear-gradient(135deg, #46d5c2, #10a394);
  }
}
</style>
