import { createApp } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import pinia from './store'
import permission from './directives/permission'

// 说明：Element Plus 的 JS 由 unplugin-vue-components 按需引入（首屏体积小），
// 但 ElMessage / ElMessageBox 这类“命令式调用”的组件样式不会被自动引入，
// 否则弹窗会渲染成没有样式的裸 DOM（按钮错位到左上角）。
// 这里直接引一份完整 CSS（体积可接受，且只加载一次），配置简单、不会再出现缺样式的问题。
import 'element-plus/dist/index.css'
import '@/styles/index.scss'
import '@/styles/element-vars.scss'

const app = createApp(App)

app.use(pinia)
app.use(router)

// 按钮级权限指令：v-permission="P.roleAdd"
app.directive('permission', permission)

app.mount('#app')

/**
 * 开发期调试钩子（仅在 dev 生效，build 时整段会被摇掉）
 * 用法：控制台里 `__stores.menu().modules` / `__stores.user().permissions`
 * 排查"菜单为什么没显示""权限为什么不对"时很省事。
 */
if (import.meta.env.DEV) {
  Promise.all([import('./store/menu'), import('./store/user')]).then(([menu, user]) => {
    ;(window as unknown as Record<string, unknown>).__stores = {
      menu: menu.useMenuStore,
      user: user.useUserStore
    }
  })
}
