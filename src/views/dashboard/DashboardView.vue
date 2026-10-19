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
            <span class="stat-label">{{ cardLabel(card) }}</span>
            <span class="stat-value">{{ card.value }}</span>
          </span>
        </div>
      </div>

      <!-- ---------------- 右：系统监控概览 ---------------- -->
      <div class="monitor-col">
        <div class="page-card monitor-card">
          <div class="monitor-head">
            <div class="card-title">{{ t('dashboard.title') }}</div>

            <!-- 警报实时推送状态（WebSocket） -->
            <div class="live-pill" :class="`is-${socketStatus}`" :title="liveHint">
              <span class="live-dot" />
              <span class="live-text">{{ liveLabel }}</span>
              <span v-if="received > 0" class="live-count">
                {{ t('dashboard.live.received', { count: received }) }}
              </span>
            </div>
          </div>

          <el-alert
            v-if="socketStatus === 'disabled'"
            type="info"
            :closable="false"
            class="live-alert"
            :title="t('dashboard.live.disabledHint')"
          />

          <div class="monitor-body">
            <DonutChart
              :value="data?.onlineRate || 0"
              :size="320"
              :thickness="108"
              :label="t('dashboard.onlineRate')"
            >
              <span class="donut-value">{{ data?.onlineRate || 0 }}%</span>
              <span class="donut-label">{{ t('dashboard.onlineRate') }}</span>
            </DonutChart>

            <div class="legend-wrap">
              <ul class="legend">
                <li v-for="(item, i) in data?.monitor || []" :key="item.name">
                  <span class="legend-dot" :style="{ background: item.color }" />
                  <span class="legend-name">{{ monitorLabel(item.name, i) }}</span>
                  <span class="legend-value">{{ item.value }}</span>
                </li>
              </ul>

              <!-- 最近一条推送：让"实时"这件事看得见，而不是只有数字在跳 -->
              <div v-if="lastAlarm" class="last-alarm">
                <span class="last-label">{{ lastAlarm.sn }}</span>
                <span class="last-time">
                  {{ t('dashboard.live.lastAt', { time: lastAlarm.time }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统监控概览（首页看板）
 * ------------------------------------------------------------
 * 这个页面**不是旧站那套**（旧站是按 9 个分类切换、每类 4 个卡），
 * 而是新的"全局指标 + 环形图 + 实时警报推送"。
 *
 * 实时来源：WebSocket `/api/alarmWebSocket`（见 composables/useAlarmSocket.ts）
 *   - 真实环境：配置 VITE_WS_URL（后端/网关给一个已带鉴权的完整地址）
 *   - 演示模式：本地模拟推送，指示点显示「模擬推送」，不会冒充真实连接
 *
 * ⚠️ 统计卡的数值目前仍来自 mock（口径待需求方确认，见文档 P0-2）；
 *    实时推送只负责"有新警报时把数字顶上去 + 弹通知"，不改变初始值来源。
 */
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { Connection, Iphone, OfficeBuilding, Warning } from '@element-plus/icons-vue'
import DonutChart from '@/components/DonutChart.vue'
import { getDashboardApi } from '@/api/dashboard'
import { useAlarmSocket, type AlarmPushData } from '@/composables/useAlarmSocket'
import { DEMO_MODE } from '@/demo'
import { bumpAlarm, type DashboardData, type StatCard } from '@/mock'

const { t } = useI18n()

const data = ref<DashboardData>()
const cards = ref<StatCard[]>([])

const ICONS = [Connection, Warning, Iphone, OfficeBuilding]
function iconOf(i: number) {
  return ICONS[i] || Connection
}

/**
 * 统计卡标题：按 card.key 走 i18n，取不到再用接口给的 label 兜底。
 * 这样 mock / 真实接口 / 后端改文案三种情况都不会显示成 key。
 */
function cardLabel(card: StatCard): string {
  const key = `dashboard.cards.${card.key}`
  const translated = t(key)
  return translated === key ? card.label : translated
}

/** 图例名称：mock 给的是中文名，先按顺序映射到 i18n，映射不到就用原名 */
const MONITOR_KEYS = ['online', 'offline', 'alarm']
function monitorLabel(name: string, index: number): string {
  const key = MONITOR_KEYS[index]
  return key ? t(`dashboard.monitor.${key}`) : name
}

/* ============================================================
 * 警报实时推送
 * ============================================================
 * 文档要求：收到 {"Type":"alarm"} 必须回 {"Type":"ack"}，否则服务端会重复推。
 * 这些细节都在 composables/useAlarmSocket.ts 里处理好了，这里只关心"收到之后干什么"。
 */
const lastAlarm = ref<{ sn: string; time: string } | null>(null)

const {
  status: socketStatus,
  received,
  start: startSocket,
  stop: stopSocket
} = useAlarmSocket({ onAlarm: handleAlarm })

/**
 * 拉一次看板统计。
 * ★ 这是文档要求的链路：WebSocket 只推"有新警报"这个信号（几个关键字段），
 *   **最新内容必须再用 HTTP 查一次**，而不是拿推送里的字段自己算。
 */
async function refreshStats() {
  try {
    const fresh = await getDashboardApi()
    data.value = fresh
    cards.value = fresh.cards
  } catch {
    // 刷新失败保留旧数据，等下一次推送再刷
  }
}

/** 收到一条警报：先让后端"记上"（仅演示），再走 HTTP 刷新，最后弹通知 */
async function handleAlarm(push: AlarmPushData) {
  // 演示环境：没有真后端，先让本地 mock 把这条警报计进去，后面的 HTTP 刷新才有变化可看
  if (DEMO_MODE) bumpAlarm()

  // ★ 关键：按文档走 HTTP 重新拉取最新统计
  await refreshStats()

  // 记下最近一条，给界面上的"实时"一个具体证据
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  lastAlarm.value = { sn: push.SN, time: `${hh}:${mm}:${ss}` }

  // 右下角弹通知（不打断操作）
  ElNotification({
    title: t('dashboard.live.alarmTitle'),
    message: `${push.SN}${push.CustomerSN ? ` · ${push.CustomerSN}` : ''}`,
    type: 'warning',
    position: 'bottom-right',
    duration: 4000
  })
}

/** 状态点文案 */
const liveLabel = computed(() => {
  const map: Record<string, string> = {
    open: t('dashboard.live.on'),
    simulating: t('dashboard.live.simulating'),
    connecting: t('dashboard.live.connecting'),
    closed: t('dashboard.live.closed'),
    disabled: t('dashboard.live.disabled')
  }
  return map[socketStatus.value] || t('dashboard.live.closed')
})

const liveHint = computed(() =>
  socketStatus.value === 'disabled' ? t('dashboard.live.disabledHint') : t('dashboard.live.title')
)

onMounted(async () => {
  await refreshStats()
})

/**
 * keep-alive 生命周期（**这就是后端要的"离开就不用管"**）
 * ------------------------------------------------------------
 * MainLayout 把页面放在 <keep-alive> 里，所以离开时**不会卸载**，
 * onBeforeUnmount 不会触发。必须用 onDeactivated 才能真正把心跳停掉，
 * 否则用户切到 CMP Setting 之后，心跳还会一直发。
 */
onActivated(() => {
  startSocket()
})

onDeactivated(() => {
  stopSocket()
})

onBeforeUnmount(() => {
  stopSocket()
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

/* 标题行 + 实时推送状态点 */
.monitor-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  font-size: 12px;
  color: $text-secondary;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  cursor: default;

  // 真实连接：绿
  &.is-open {
    color: #0f9b6c;
    background: #e9fbf3;
    border-color: #b6ebd6;
  }

  // 演示模拟：橙（刻意和"真连上"区分开）
  &.is-simulating {
    color: #d48806;
    background: #fff8e6;
    border-color: #ffe0a3;
  }

  &.is-connecting {
    color: #d48806;
    background: #fff8e6;
    border-color: #ffe0a3;
  }

  &.is-closed {
    color: #ef4444;
    background: #fef2f2;
    border-color: #fca5a5;
  }
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentcolor;
  animation: live-blink 1.6s ease-in-out infinite;
}

@keyframes live-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}

.live-count {
  padding-left: 6px;
  border-left: 1px solid currentcolor;
  opacity: 0.75;
}

.live-alert {
  flex: none;
  margin-bottom: 8px;
}

.legend-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.last-alarm {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 10px;
  border-top: 1px dashed #e8ecf3;
  font-size: 12px;
}

.last-label {
  font-family: Consolas, monospace;
  color: $text-main;
}

.last-time {
  color: $text-secondary;
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
