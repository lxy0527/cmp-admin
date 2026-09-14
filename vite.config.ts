import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts'
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/components.d.ts'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: '@use "@/styles/variables.scss" as *;'
      }
    }
  },
  server: {
    // 不写 host：跟隔壁 web-portal 保持一致，走 Vite 默认值（终端打印 http://localhost:5173）
    // 需要固定绑 IPv4 或让局域网可访问时，再显式写 host: '127.0.0.1' / host: true
    port: 5173,
    // 启动后自动打开浏览器，跟隔壁 web-portal 一样；不想自动开就改回 false
    open: true
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500
  }
})
