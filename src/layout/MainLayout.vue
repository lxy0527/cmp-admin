<template>
  <div class="layout">
    <!-- ---------------- 顶栏信息条 ---------------- -->
    <header class="topbar">
      <!-- 左：logo + 项目信息 -->
      <div class="topbar-left">
        <AppLogo />
        <div class="project">
          <div class="project-name">
            <el-icon class="project-icon"><OfficeBuilding /></el-icon>
            <span class="ellipsis">洪福西樓（洪福西樓）</span>
          </div>
          <div class="project-meta ellipsis">項目類型：Production</div>
          <div class="project-meta ellipsis">工程編號：SSLS9</div>
        </div>
      </div>

      <!-- 中：环境监测 + 天气 + 时间 -->
      <div class="topbar-center">
        <div class="info-block">
          <div class="info-head">
            <el-icon class="dot-red"><WarningFilled /></el-icon>
            <span class="info-title">微網環境監測</span>
          </div>
          <div class="info-line">
            <span>網關：<em class="off">Offline</em></span>
            <span class="sep">|</span>
            <span>風速：<em>-- m/s</em></span>
          </div>
          <div class="info-line">
            <span>生產日期：<em>{{ dateText }}</em></span>
          </div>
        </div>

        <div class="info-block weather">
          <div class="weather-temp">
            <span class="temp">29.3℃</span>
            <el-icon class="sun"><Sunny /></el-icon>
          </div>
          <div class="info-line">
            <span>體感温度 <em>67</em></span>
            <span class="sep">|</span>
            <span>濕度 <em>72%</em></span>
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
            <span class="lunar">{{ weekText }} · 農曆 {{ lunarText }}</span>
          </div>
        </div>

        <div class="info-block alarm">
          <div class="info-title">報警通知</div>
          <div class="info-line">未處理報警: 現場工作還未需處理</div>
          <div class="info-line">註冊總保養: --</div>
        </div>
      </div>

      <!-- 右：用户 -->
      <div class="topbar-right">
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
              <el-dropdown-item command="dashboard">系统监控概览</el-dropdown-item>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
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
        {{ mod.title }}
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
      <!-- 左侧菜单：完全由 MenuTree 递归渲染，布局不认识具体菜单 -->
      <aside v-if="sidebarMenus.length" class="sidebar">
        <MenuTree
          :nodes="sidebarMenus"
          :active-key="route.path"
          :expanded-keys="expandedKeys"
          @navigate="openNode"
          @toggle="toggleNode"
        />
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
  Odometer,
  OfficeBuilding,
  Setting,
  Sunny,
  UserFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import AppLogo from '@/components/AppLogo.vue'
import MenuTree from './MenuTree.vue'
import { useUserStore } from '@/store/user'
import { useMenuStore } from '@/store/menu'
import { findAncestorKeys, type MenuNode } from '@/config/menuTypes'
import { formatDate, formatLunar, formatTime, formatWeek } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()

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
const weekText = computed(() => formatWeek(now.value))
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
    ElMessage.info('修改密码：等接口就绪后再做（占位）')
    return
  }
  if (command === 'logout') {
    await ElMessageBox.confirm('确认退出登录吗？', '提示', { type: 'warning' }).catch(() => 'cancel')
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
  background: $page-bg;
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

.content {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
