<template>
  <div class="layout">
    <!-- 演示模式横幅：仅公网示例构建时出现（VITE_DEMO_MODE=true），关不掉 -->
    <DemoBanner />

    <!-- ---------------- 顶栏信息条 ---------------- -->
    <header class="topbar">
      <!-- 左：logo + 项目信息 -->
      <div class="topbar-left">
        <!-- 窄屏才有：把左侧菜单以抽屉形式调出来 -->
        <button
          class="menu-toggle"
          type="button"
          aria-label="菜单"
          @click="sidebarOpen = !sidebarOpen"
        >
          <el-icon><Menu /></el-icon>
        </button>
        <AppLogo />
        <div class="project">
          <div class="project-name">
            <el-icon class="project-icon"><OfficeBuilding /></el-icon>
            <span class="ellipsis">洪福西樓（洪福西樓）</span>
          </div>
          <div class="project-meta ellipsis">{{ t('topbar.projectType') }}：Production</div>
          <div class="project-meta ellipsis">{{ t('topbar.projectNo') }}：SSLS9</div>
        </div>
      </div>

      <!-- 中：环境监测 + 天气 + 时间 -->
      <div class="topbar-center">
        <div class="info-block">
          <div class="info-head">
            <el-icon class="dot-red"><WarningFilled /></el-icon>
            <span class="info-title">{{ t('topbar.environmentMonitoring') }}</span>
          </div>
          <div class="info-line">
            <span>{{ t('topbar.gateway') }}：<em class="off">Offline</em></span>
            <span class="sep">|</span>
            <span>{{ t('topbar.windSpeed') }}：<em>-- m/s</em></span>
          </div>
          <div class="info-line">
            <span>{{ t('topbar.productionDate') }}：<em>{{ dateText }}</em></span>
          </div>
        </div>

        <div class="info-block weather">
          <div class="weather-temp">
            <span class="temp">29.3℃</span>
            <el-icon class="sun"><Sunny /></el-icon>
          </div>
          <div class="info-line">
            <span>{{ t('topbar.feelsLike') }} <em>67</em></span>
            <span class="sep">|</span>
            <span>{{ t('topbar.humidity') }} <em>72%</em></span>
          </div>
        </div>

        <div class="info-block datetime">
          <div class="date-row">
            <el-icon class="cal"><Calendar /></el-icon>
            <span class="big-date">{{ dateText }}</span>
          </div>
          <div class="info-line">
            <span>{{ timeText }}</span>
            <span class="sep">|</span>
            <span class="lunar">{{ weekText }} · {{ t('topbar.lunar') }} {{ lunarText }}</span>
          </div>
        </div>

        <div class="info-block alarm">
          <div class="info-title">{{ t('topbar.alarmNotice') }}</div>
          <div class="info-line">{{ t('topbar.unprocessedAlarm') }}: 現場工作還未需處理</div>
          <div class="info-line">{{ t('topbar.maintenance') }}: --</div>
        </div>
      </div>

      <!-- 右：用户 -->
      <div class="topbar-right">
        <!-- 语言切换：繁 / 简 / 英（默认繁，选择结果存 localStorage） -->
        <el-dropdown trigger="click" @command="handleLocaleCommand">
          <span class="locale-switch">
            <el-icon><Switch /></el-icon>
            <span class="locale-label">{{ currentLocaleLabel }}</span>
            <el-icon class="arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="opt in LOCALE_OPTIONS"
                :key="opt.value"
                :command="opt.value"
                :disabled="opt.value === currentLocale"
              >
                {{ opt.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-icon class="sys-icon"><Setting /></el-icon>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user">
            <el-avatar :size="24" class="user-avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <span class="user-name">{{ userStore.nickname }}</span>
            <el-icon class="arrow"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="dashboard">{{ t('dashboard.title') }}</el-dropdown-item>
              <el-dropdown-item command="password">{{ t('navigationBar.changePassword') }}</el-dropdown-item>
              <el-dropdown-item command="logout" divided>{{ t('navigationBar.logout') }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ---------------- 顶部大 Tab（来自菜单 store 的顶层节点） ---------------- -->
    <nav class="tabbar">
      <button
        v-for="mod in modules"
        :key="mod.key"
        class="big-tab"
        :class="{ active: activeModuleKey === mod.key }"
        @click="goModule(mod)"
      >
        <span class="tab-icon" :class="`icon-${mod.icon || mod.key}`">
          <el-icon>
            <DataLine v-if="(mod.icon || mod.key) === 'data-receiving' || mod.icon === 'data'" />
            <Setting v-else />
          </el-icon>
        </span>
        {{ moduleLabel(mod) }}
        <span v-if="mod.badge" class="tab-badge">{{ mod.badge }}</span>
      </button>

      <button class="big-tab big-tab--dashboard" :class="{ active: isDashboard }" @click="router.push('/dashboard')">
        <span class="tab-icon icon-dashboard">
          <el-icon><Odometer /></el-icon>
        </span>
        Dashboard
      </button>
    </nav>

    <!-- ---------------- 主体 ---------------- -->
    <div class="body">
      <!-- 窄屏抽屉的遮罩：点空白处收起菜单（桌面端由 CSS 隐藏，不参与交互） -->
      <div v-if="sidebarOpen" class="sidebar-mask" @click="sidebarOpen = false" />

      <!-- 左侧菜单：完全由 MenuTree 递归渲染，布局不认识具体菜单 -->
      <aside
        v-if="sidebarMenus.length"
        class="sidebar"
        :class="{ 'is-open': sidebarOpen }"
      >
        <MenuTree
          :nodes="sidebarMenus"
          :active-key="route.path"
          :expanded-keys="expandedKeys"
          @navigate="openNode"
          @toggle="toggleNode"
        />

        <!-- 窄屏抽屉底部常驻：桌面顶栏那几块（项目/环境/时钟）在手机上被收起了，
             抽屉下半截本来也空着，正好把展示性信息挪到这里，不额外占内容区高度。
             桌面端由 CSS 隐藏，不影响原布局。 -->
        <div class="sidebar-info">
          <div class="si-head">
            <el-icon class="dot-red"><WarningFilled /></el-icon>
            <span>{{ t('topbar.environmentMonitoring') }}</span>
          </div>
          <div class="si-line">
            <span>{{ t('topbar.gateway') }}：<em class="off">Offline</em></span>
            <span class="sep">|</span>
            <span>{{ t('topbar.windSpeed') }}：<em>-- m/s</em></span>
          </div>
          <div class="si-line">
            <span>{{ t('topbar.productionDate') }}：<em>{{ dateText }}</em></span>
          </div>
          <div class="si-divider" />
          <div class="si-line si-line--weather">
            <span class="temp">29.3℃</span>
            <span>{{ t('topbar.feelsLike') }} <em>67</em></span>
            <span class="sep">|</span>
            <span>{{ t('topbar.humidity') }} <em>72%</em></span>
          </div>
          <div class="si-divider" />
          <div class="si-line si-line--strong">{{ dateText }}　{{ timeText }}</div>
          <div class="si-line si-line--muted">{{ weekText }} · {{ t('topbar.lunar') }} {{ lunarText }}</div>
          <div class="si-foot">
            {{ t('topbar.projectType') }}：Production　{{ t('topbar.projectNo') }}：SSLS9
          </div>
        </div>
      </aside>

      <main class="content">
        <router-view v-slot="{ Component }">
          <keep-alive :max="6">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  Calendar,
  DataLine,
  Menu,
  Odometer,
  OfficeBuilding,
  Setting,
  Sunny,
  Switch,
  UserFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import DemoBanner from '@/components/DemoBanner.vue'
import MenuTree from './MenuTree.vue'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'
import { findAncestorKeys, type MenuNode } from '@/config/menuTypes'
import { formatDate, formatLunar, formatTime } from '@/utils/format'
import { useI18n } from 'vue-i18n'
import { LOCALE_OPTIONS, setLocale, type LocaleKey } from '@/locales'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()

/**
 * 窄屏（≤900px）下左侧菜单改为抽屉：默认收起，由顶栏的汉堡按钮唤出。
 * 桌面端这个状态不生效——样式里 .sidebar 本来就是常驻的。
 */
const sidebarOpen = ref(false)

/* ---------------- 多语言（繁 / 简 / 英） ---------------- */
const { t, locale } = useI18n()

const currentLocale = computed(() => locale.value as LocaleKey)

const currentLocaleLabel = computed(
  () => LOCALE_OPTIONS.find((o) => o.value === currentLocale.value)?.label || '繁體中文'
)

/** 顶部大 Tab 显示名：有 titleKey 走 i18n，否则用 title 兜底 */
function moduleLabel(mod: MenuNode): string {
  return mod.titleKey ? t(mod.titleKey) : mod.title
}

/** 切换语言（写 localStorage + 同步 <html lang>，页面不重载） */
function handleLocaleCommand(value: string) {
  setLocale(value as LocaleKey)
}

/* ---------------- 顶栏时钟 ---------------- */
const now = ref(new Date())
let timer: number | undefined

onMounted(async () => {
  // 每秒刷新一次顶栏的日期/时间/农历展示
  timer = window.setInterval(() => (now.value = new Date()), 1000)
  // 兜底：正常情况下路由守卫已经拉过用户信息了；这里只处理"守卫被跳过"的边角情况
  if (userStore.isLogin && !userStore.userInfo) {
    userStore.fetchUserInfo().catch(() => void 0)
  }
  // 加载菜单（幂等；静态模式下是本地计算，动态模式下走接口）
  await menuStore.loadMenus()
  syncExpanded()
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

const dateText = computed(() => formatDate(now.value))
const timeText = computed(() => formatTime(now.value))
/** 星期几走 i18n（formatWeek 里是写死的中文，切英文就会露馅） */
const weekText = computed(() => t(`common.weekdays.${now.value.getDay()}`))
const lunarText = computed(() => formatLunar(now.value))

/* ---------------- 菜单 / Tab（数据全部来自 store，本组件不判断权限） ---------------- */
/** 顶部大 Tab = 菜单树的顶层节点（store 已按权限过滤，无权限的模块整个不会出现） */
const modules = computed(() => menuStore.modules)

const activeModuleKey = computed(() => {
  const matched = menuStore.modules.find((m) => route.path.startsWith(m.key))
  return matched?.key || ''
})

const isDashboard = computed(() => route.path.startsWith('/dashboard'))

/** 左侧菜单 = 当前模块节点的子级 */
const sidebarMenus = computed<MenuNode[]>(() => {
  const mod = modules.value.find((m) => m.key === activeModuleKey.value)
  return mod?.children || []
})

/* ---------------- 展开/收起（布局持有状态，MenuTree 只负责画） ---------------- */
const expandedKeys = ref<string[]>([])

function toggleNode(node: MenuNode) {
  const set = new Set(expandedKeys.value)
  if (set.has(node.key)) set.delete(node.key)
  else set.add(node.key)
  expandedKeys.value = [...set]
}

/** 当前路由变化后，自动展开它所在的父级链（否则深层菜单会"看不见自己在哪"） */
function syncExpanded() {
  const all = menuStore.modules.flatMap((m) => m.children || [])
  const rootKey = menuStore.modules.find((m) => route.path.startsWith(m.key))?.key
  const ancestors = rootKey ? [rootKey, ...findAncestorKeys(all, route.path)] : []
  expandedKeys.value = [...new Set([...expandedKeys.value, ...ancestors])]
}

// immediate：首屏（例如直接打开 /data-receiving/permitted-to-work）也要展开到位
watch(() => [route.path, menuStore.modules] as const, syncExpanded, { immediate: true })

/** 窄屏抽屉：跳转到新页面后自动收起，否则会一直挡住内容 */
watch(() => route.path, () => {
  sidebarOpen.value = false
})

/**
 * 点击菜单节点：统一入口
 * 支持三件事，且都在数据里声明（渲染层不用改）：
 *   - 外链：externalLink → 新窗口打开
 *   - 分组：没有 routePath → 只切换展开状态
 *   - 普通页面：router.push
 */
function openNode(node: MenuNode) {
  if (node.externalLink) {
    window.open(node.externalLink, '_blank', 'noopener')
    return
  }
  if (!node.routePath) {
    toggleNode(node)
    return
  }
  router.push(node.routePath)
}

/** 点大 Tab 时跳到该模块下**第一个可点菜单**，避免跳到一个会被守卫拦回 403 的页面 */
function goModule(mod: MenuNode) {
  const first = findFirstNavigable(mod)
  if (first) router.push(first)
}

function findFirstNavigable(node: MenuNode): string | undefined {
  if (node.routePath && !node.disabled) return node.routePath
  for (const child of node.children || []) {
    const found = findFirstNavigable(child)
    if (found) return found
  }
  return undefined
}

/* ---------------- 用户操作 ---------------- */
async function handleCommand(command: string) {
  if (command === 'dashboard') {
    router.push('/dashboard')
    return
  }
  if (command === 'password') {
    // 修改密码页早已就绪（/api/changePassword + 邮箱验证码），直接跳过去
    router.push('/forgot-password')
    return
  }
  if (command === 'logout') {
    await ElMessageBox.confirm(
      t('navigationBar.logoutConfirmMessage'),
      t('navigationBar.logoutConfirmTitle'),
      { type: 'warning' }
    ).catch(() => 'cancel')
    await userStore.logout()
    router.replace('/login')
  }
}
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* 移动端地址栏展开/收起时不会露出底部背景；不支持的浏览器用上面的 100% */
  height: 100dvh;
  background: $page-bg;
}

/* 汉堡按钮：桌面端不存在（由 media query 打开） */
.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  color: $text-main;
  background: transparent;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  cursor: pointer;

  &:active {
    background: rgba(61, 139, 253, 0.08);
  }
}

/* 抽屉遮罩：桌面端永不出现 */
.sidebar-mask {
  display: none;
}

/* ---------------- 顶栏 ---------------- */
.topbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  height: $header-height;
  padding: 0 14px;
  background: $header-bg;
  border-bottom: 1px solid $border-color;
  overflow: hidden;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  width: 216px;
  min-width: 0;
}

.project {
  min-width: 0;
  line-height: 1.3;
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.project-name {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: $text-main;
}

.project-icon {
  flex: none;
  color: $primary;
}

.project-meta {
  font-size: 11px;
  color: $text-secondary;
  white-space: nowrap;
}

.topbar-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-width: 0;
  overflow: hidden;
}

.info-block {
  font-size: 11px;
  color: $text-regular;
  line-height: 1.45;
  white-space: nowrap;
}

/* 窄屏时优先保证核心信息不被挤爆 */
@media (max-width: 1560px) {
  .topbar-center {
    gap: 16px;
  }

  .info-block.alarm {
    display: none;
  }
}

.info-head {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-title {
  font-weight: 600;
  color: $text-main;
}

.info-line {
  color: $text-secondary;

  em {
    font-style: normal;
    color: $primary;
    font-weight: 600;
  }

  .off {
    color: $danger;
  }
}

.dot-red {
  color: $danger;
}

.sep {
  margin: 0 4px;
  color: #dcdfe6;
}

.weather-temp {
  display: flex;
  align-items: center;
  gap: 6px;
}

.temp {
  font-size: 13px;
  font-weight: 700;
  color: $text-main;
}

.sun {
  color: $warning;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal {
  color: $primary;
}

.big-date {
  font-size: 12px;
  font-weight: 600;
  color: $text-main;
}

.lunar {
  color: #9aa3b2;
}

.topbar-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sys-icon {
  color: $text-secondary;
  cursor: pointer;
}

.user {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}

.user-avatar {
  background: $primary;
  color: #fff;
}

.user-name {
  font-size: 12px;
  color: $text-main;
}

.arrow {
  color: $text-secondary;
  font-size: 12px;
}

/* 语言切换入口（繁 / 简 / 英） */
.locale-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: $text-main;
  cursor: pointer;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  outline: none;
  transition: all 0.18s;

  &:hover {
    color: $primary;
    border-color: $primary;
  }
}

.locale-label {
  line-height: 1.2;
}

/* ---------------- 大 Tab ---------------- */
.tabbar {
  flex: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: $tabbar-height;
  background: $tabbar-bg;
  border-bottom: 1px solid $border-color;
}

.big-tab--dashboard {
  position: absolute;
  right: 16px;
}

.big-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  color: $text-regular;
  background: transparent;
  border: 0;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $primary;
    background: rgba(61, 139, 253, 0.06);
  }

  &.active {
    color: $primary;
    font-weight: 600;
    background: rgba(61, 139, 253, 0.1);
  }
}

.tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 窄屏下 Tab 文字变长会把图标挤扁，这里钉死尺寸 */
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;

  &.icon-data-receiving {
    background: linear-gradient(135deg, #4f9dff, #2f6fe0);
  }

  &.icon-cmp-setting {
    background: linear-gradient(135deg, #ff7a59, #e0451f);
  }

  &.icon-dashboard {
    background: linear-gradient(135deg, #7c5cff, #4f37d4);
  }

  /* 模块图标（菜单树顶层节点的 icon 字段，见 MenuIcon.vue 的映射） */
  &.icon-setting {
    background: linear-gradient(135deg, #ff7a59, #e0451f);
  }

  &.icon-monitor {
    background: linear-gradient(135deg, #46d5c2, #10a394);
  }
}

.tab-badge {
  margin-left: 4px;
  padding: 0 5px;
  height: 15px;
  line-height: 15px;
  font-size: 10px;
  color: #fff;
  background: $danger;
  border-radius: 8px;
}

/* ---------------- 主体 ---------------- */
.body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.sidebar {
  flex: none;
  width: 200px;
  background: $sidebar-bg;
  border-right: 1px solid $border-color;
  overflow-y: auto;
  /* 菜单项样式在 MenuTree.vue 里（递归组件自带），这里只管容器 */
  padding: 8px 0;
}

/* 抽屉底部那块「项目 / 环境 / 时钟」信息，只有窄屏抽屉里才出现 */
.sidebar-info {
  display: none;
}

.content {
  flex: 1;
  min-width: 0;
  overflow: auto;
  /* iOS 上让内容区滚动带惯性 */
  -webkit-overflow-scrolling: touch;
  /* 刘海屏横屏时内容不要钻进圆角 */
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
  /* iPhone 底部 Home 条会压住表格最后一行和分页，滚到底时留出这条安全区 */
  padding-bottom: env(safe-area-inset-bottom);
}

/* ==================== 窄屏（平板竖屏 / 手机） ====================
 * 这里不是把桌面版缩放，是换一套布局：
 *   顶栏信息块整块收起 → 汉堡按钮调出抽屉菜单 → 大 Tab 横向滚动。
 */
@media (max-width: 900px) {
  .menu-toggle {
    display: inline-flex;
  }

  .topbar {
    gap: 8px;
    height: 44px;
    padding: 0 10px;
    padding-top: env(safe-area-inset-top);
  }

  .topbar-left {
    width: auto;
    flex: 1;
    min-width: 0;
  }

  /* 六块环境/天气/时钟/告警信息在手机上无处安放，整体收起；
     它们本身是展示性信息，不影响任何操作 */
  .topbar-center {
    display: none;
  }

  .project-meta {
    display: none;
  }

  .sys-icon,
  .user-name {
    display: none;
  }

  .locale-switch {
    padding: 2px 6px;
  }

  /* 大 Tab：横向滚动，不换行、不压缩 */
  .tabbar {
    justify-content: flex-start;
    gap: 6px;
    height: 38px;
    padding: 0 10px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .big-tab {
    flex: none;
    white-space: nowrap;
  }

  /* Dashboard 原本绝对定位在右上角，手机上改为跟随 Tab 排布 */
  .big-tab--dashboard {
    position: static;
    margin-left: auto;
  }

  /* 左侧菜单 → 抽屉。
     顶栏显式给个小 z-index，抽屉/遮罩才能稳定压在它上面
     （之前顶栏是 static + auto，在部分安卓 WebView 里抽屉顶部会被顶栏盖住） */
  .topbar {
    position: relative;
    z-index: 1;
  }

  .sidebar-mask {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 998;
    background: rgba(0, 0, 0, 0.35);
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 999;
    width: 240px;
    max-width: 78vw;
    padding-top: calc(8px + env(safe-area-inset-top));
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: none;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    /* 竖着分成两段：菜单自己滚，底部信息常驻 */
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.is-open {
      transform: none;
      box-shadow: 2px 0 16px rgba(0, 0, 0, 0.14);
    }
  }

  .sidebar .menu-tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  /* 顶栏在手机上收起的展示性信息，挪到抽屉下半截常驻 */
  .sidebar-info {
    display: flex;
    flex: none;
    flex-direction: column;
    gap: 3px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid $border-color;
    font-size: 12px;
    line-height: 1.6;
    color: $text-secondary;

    em {
      font-style: normal;
      font-weight: 600;
      color: $primary;
    }

    .off {
      color: $danger;
    }

    .sep {
      margin: 0 4px;
      color: #dcdfe6;
    }

    .temp {
      font-size: 14px;
      font-weight: 700;
      color: $text-main;
    }
  }

  .si-head {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    color: $text-main;
  }

  .si-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 2px;
  }

  .si-line--strong {
    font-weight: 600;
    color: $text-main;
  }

  .si-line--muted {
    color: #9aa3b2;
  }

  .si-divider {
    height: 1px;
    margin: 3px 0;
    background: $border-color;
  }

  .si-foot {
    margin-top: 2px;
    color: #9aa3b2;
  }
}

/* ==================== 手机竖屏 ==================== */
@media (max-width: 600px) {
  .topbar {
    height: 42px;
  }

  .content {
    /* 小屏上留白比桌面紧一档，否则一屏放不下任何内容 */
    :deep(.page) {
      padding: 8px;
    }

    :deep(.page-card) {
      padding: 12px;
      border-radius: $radius-base;
    }
  }
}

/* 触摸设备：去掉 hover 残留的高亮，避免点完还亮着 */
@media (hover: none) {
  .big-tab:hover {
    color: inherit;
    background: transparent;

    &.active {
      color: $primary;
      background: rgba(61, 139, 253, 0.1);
    }
  }
}
</style>
