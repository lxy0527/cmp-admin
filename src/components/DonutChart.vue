<template>
  <div class="donut" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- 底环：始终绘制，value=0 时就是设计图里那个灰色空环 -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="#e8ebf0"
        :stroke-width="thickness"
      />
      <!-- 数据环：按百分比画弧，从 12 点方向顺时针 -->
      <circle
        v-if="hasData"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="thickness"
        stroke-linecap="butt"
        :stroke-dasharray="`${dash} ${circumference}`"
        :transform="`rotate(-90 ${center} ${center})`"
      />
    </svg>
    <div class="donut-inner">
      <!-- 中间内容交给父组件插槽（不同页面要显示的字不一样） -->
      <slot>
        <span v-if="hasData" class="donut-value">{{ value }}</span>
        <span v-else class="donut-empty">暂无数据</span>
        <span v-if="label" class="donut-label">{{ label }}</span>
      </slot>
    </div>
  </div>
</template>

<!--
  环形图（纯 SVG，没引 ECharts）
  ------------------------------------------------------------
  为什么不用图表库：这个壳子只需要"一个环 + 中间文字"。
  引 ECharts 会增加约 300KB 依赖，而现在连真实指标都还没定。
  后续如果真要做多图联动、缩放、tooltip，再换 ECharts 也不迟（替换本组件即可）。

  实现要点：用 `stroke-dasharray` 画弧，`rotate(-90)` 让起点落在 12 点方向；
  value = 0 时不画数据环，只留底环 + "暂无数据"，正好对应设计图上那个灰色空圈。
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 百分比 0 - 100 */
    value?: number
    /** 直径（px） */
    size?: number
    /** 环的宽度（px） */
    thickness?: number
    color?: string
    label?: string
  }>(),
  { value: 0, size: 420, thickness: 150, color: '#3d8bfd', label: '' }
)

const center = computed(() => props.size / 2)
/** 半径要减去半个环宽，否则环会被画到画布外 */
const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
/** 0 视为"无数据"，不画数据环 */
const hasData = computed(() => props.value > 0)
/** 要画的弧长 */
const dash = computed(() => (circumference.value * props.value) / 100)
</script>

<style scoped lang="scss">
.donut {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.donut-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.donut-value {
  font-size: 30px;
  font-weight: 700;
  color: $primary;
}

.donut-label {
  font-size: 12px;
  color: $text-secondary;
}

.donut-empty {
  font-size: 13px;
  color: $text-secondary;
}
</style>
