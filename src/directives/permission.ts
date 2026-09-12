import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/store/user'

/**
 * 按钮级权限指令
 * ------------------------------------------------------------
 * 用法：
 *   <el-button v-permission="P.roleAdd">新增</el-button>      // 单个权限点
 *   <el-button v-permission="[P.roleEdit, P.roleAdd]">编辑</el-button> // 任一命中即可
 *
 * 行为：无权限时把元素从 DOM 里摘掉（不是 display:none，避免被审查元素看出来）。
 *
 * ⚠️ 这只是"显示控制"。真正的鉴权必须在后端做——前端摘掉按钮挡不住直接调接口的人。
 */
export const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore()
    if (!userStore.hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}

export default permission
