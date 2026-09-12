<template>
  <div class="page dashboard">
    <div class="dash-grid">
      <!-- ---------------- 左：统计卡 ---------------- -->
      <div class="stat-col">
        <div v-for="(card, i) in cards" :key="card.key" class="stat-card" :class="`stat-card--${i}`">
          <span class="stat-icon">
            <el-icon><component :is="iconOf(i)" /></el-icon>
          </span>
          <span class="stat-info">
            <span class="stat-label">{{ card.label }}</span>
            <span class="stat-value">{{ card.value }}</span>
          </span>
        </div>
      </div>

      <!-- ---------------- 右：系统监控概览 ---------------- -->
      <div class="monitor-col">
        <div class="page-card monitor-card">
          <div class="card-title">系统监控概览</div>
          <div class="monitor-body">
            <DonutChart :value="data?.onlineRate || 0" :size="320" :thickness="108" label="设备在线率">
              <span class="donut-value">{{ data?.onlineRate || 0 }}%</span>
              <span class="donut-label">设备在线率</span>
            </DonutChart>

            <ul class="legend">
              <li v-for="item in data?.monitor || []" :key="item.name">
                <span class="legend-dot" :style="{ background: item.color }" />
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-value">{{ item.value }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Connection, Iphone, OfficeBuilding, Warning } from '@element-plus/icons-vue'
import DonutChart from '@/components/DonutChart.vue'
import { getDashboardApi } from '@/api/dashboard'
import type { DashboardData, StatCard } from '@/mock'

const data = ref<DashboardData>()
const cards = ref<StatCard[]>([])

const ICONS = [Connection, Warning, Iphone, OfficeBuilding]
function iconOf(i: number) {
  return ICONS[i] || Connection
}

onMounted(async () => {
  data.value = await getDashboardApi()
  cards.value = data.value.cards
})
</script>

<style scoped lang="scss">
.dashboard {
  height: 100%;
}

.dash-grid {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 12px;
  height: 100%;
}

/* ---------------- 统计卡 ---------------- */
.stat-col {
  display: grid;
  grid-template-rows: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 22px;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(61, 139, 253, 0.06), transparent 60%);
    pointer-events: none;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: $text-secondary;
}

.stat-card--0::before,
.stat-card--1::before,
.stat-card--2::before,
.stat-card--3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}

.stat-card--0::before {
  background: #3d8bfd;
}
.stat-card--1::before {
  background: #f5a623;
}
.stat-card--2::before {
  background: #14b8a6;
}
.stat-card--3::before {
  background: #9254de;
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  font-size: 20px;
  color: #fff;
  box-shadow: 0 6px 14px rgba(61, 139, 253, 0.22);

  .stat-card--0 & {
    background: linear-gradient(135deg, #5aa0ff, #2f6fe0);
  }
  .stat-card--1 & {
    background: linear-gradient(135deg, #ffc061, #f08c14);
  }
  .stat-card--2 & {
    background: linear-gradient(135deg, #46d5c2, #10a394);
  }
  .stat-card--3 & {
    background: linear-gradient(135deg, #a97bff, #7a3fd1);
  }
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: $text-main;
  letter-spacing: 1px;
  line-height: 1.1;
}

/* ---------------- 监控概览 ---------------- */
.monitor-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.monitor-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
}

.donut-value {
  font-size: 38px;
  font-weight: 700;
  color: $primary;
}

.donut-label {
  font-size: 13px;
  color: $text-secondary;
}

.legend {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $text-regular;
  }
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-name {
  width: 70px;
}

.legend-value {
  font-weight: 600;
  color: $text-main;
}
</style>
