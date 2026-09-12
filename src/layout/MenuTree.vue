<template>
  <ul class="menu-tree" :class="{ 'is-sub': depth > 0 }">
    <li v-for="node in nodes" :key="node.key" class="menu-node">
      <!-- ---------- 有子菜单：分组，点击展开/收起 ---------- -->
      <div
        v-if="hasChildren(node)"
        class="menu-item menu-item--group"
        :class="{ expanded: isExpanded(node), 'is-disabled': node.disabled }"
        @click="toggle(node)"
      >
        <MenuIcon :icon="node.icon" :active="containsActive(node)" />
        <span class="menu-text ellipsis">{{ node.title }}</span>
        <span v-if="node.badge" class="menu-badge">{{ node.badge }}</span>
        <el-icon class="menu-arrow"><ArrowRight /></el-icon>
      </div>

      <!-- ---------- 叶子节点：跳转 ---------- -->
      <div
        v-else
        class="menu-item"
        :class="{ active: isActive(node), 'is-disabled': node.disabled }"
        @click="go(node)"
      >
        <MenuIcon :icon="node.icon" :active="isActive(node)" />
        <span class="menu-text ellipsis">{{ node.title }}</span>
        <span v-if="node.badge" class="menu-badge">{{ node.badge }}</span>
        <el-icon v-if="node.externalLink" class="menu-link"><TopRight /></el-icon>
      </div>

      <!-- ---------- 递归渲染子级 ---------- -->
      <MenuTree
        v-if="hasChildren(node) && isExpanded(node)"
        :nodes="node.children!"
        :depth="depth + 1"
        :active-key="activeKey"
        :expanded-keys="expandedKeys"
        @navigate="$emit('navigate', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * 左侧菜单的递归渲染组件（**不认识任何具体菜单**）
 * ============================================================
 * 输入只有一棵 MenuNode 树 + 展开状态，输出是"点击了哪个节点"的事件。
 * 所以菜单内容来自静态配置还是后端下发，这里完全不需要知道。
 *
 * 已支持的展示能力（都靠 MenuNode 上的可选字段驱动）：
 *   icon / badge / disabled / externalLink / children（任意层级）/ hidden（在 store 过滤掉）
 */
import { ArrowRight, TopRight } from '@element-plus/icons-vue'
import type { MenuNode } from '@/config/menuTypes'
import MenuIcon from './MenuIcon.vue'

defineOptions({ name: 'MenuTree' })

const props = withDefaults(
  defineProps<{
    nodes: MenuNode[]
    /** 当前层级（0 = 顶层），用于缩进和样式 */
    depth?: number
    /** 当前路由路径，用于选中态（由布局传下来，递归时继续往下传） */
    activeKey?: string
    /** 展开的节点 key 集合（由布局统一持有，保证多层展开状态一致） */
    expandedKeys?: string[]
  }>(),
  { depth: 0, activeKey: '', expandedKeys: () => [] }
)

const emit = defineEmits<{
  (e: 'navigate', node: MenuNode): void
  (e: 'toggle', node: MenuNode): void
}>()

const hasChildren = (node: MenuNode) => Boolean(node.children?.length)

const isExpanded = (node: MenuNode) => props.expandedKeys.includes(node.key)

const isActive = (node: MenuNode) => Boolean(node.routePath) && props.activeKey === node.routePath

/** 分组是否包含当前选中项（用于给分组也加高亮） */
function containsActive(node: MenuNode): boolean {
  if (!node.children?.length) return isActive(node)
  return node.children.some((child) => containsActive(child))
}

function toggle(node: MenuNode) {
  if (node.disabled) return
  emit('toggle', node)
}

function go(node: MenuNode) {
  if (node.disabled) return
  emit('navigate', node)
}
</script>

<style scoped lang="scss">
.menu-tree {
  margin: 0;
  padding: 0;
  list-style: none;

  &.is-sub {
    // 二级及以后整体右移，并加一条淡竖线，层次更清楚
    padding-left: 12px;
    margin-left: 10px;
    border-left: 1px dashed #e2e8f5;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  color: $text-regular;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.18s;
  user-select: none;

  &:hover {
    color: $primary;
    background: rgba(61, 139, 253, 0.05);
  }

  &.active {
    color: $primary;
    font-weight: 600;
    background: rgba(61, 139, 253, 0.08);
    border-left-color: $primary;
  }

  &.is-disabled {
    color: #c0c4cc;
    cursor: not-allowed;
    background: transparent;
  }
}

.menu-item--group {
  color: $text-main;
  font-weight: 500;
}

.menu-arrow {
  margin-left: auto;
  font-size: 11px;
  color: #b8c2d4;
  transition: transform 0.2s;
}

.menu-item--group.expanded .menu-arrow {
  transform: rotate(90deg);
}

.menu-link {
  margin-left: auto;
  font-size: 11px;
  color: #b8c2d4;
}

.menu-text {
  flex: 1;
  min-width: 0;
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.menu-badge {
  flex: none;
  padding: 0 5px;
  height: 15px;
  line-height: 15px;
  font-size: 10px;
  font-weight: 500;
  color: #fff;
  background: $danger;
  border-radius: 8px;
}
</style>
