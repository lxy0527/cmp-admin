import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ command, mode }) => {
  /**
   * 读取 .env*（第三个参数传 '' 表示连非 VITE_ 前缀的变量一起读）
   * ------------------------------------------------------------
   * CMP_API_ID / CMP_API_KEY 刻意**不加 VITE_ 前缀**，所以不会被注入浏览器端，
   * 只在下面 dev server 的代理里使用（实际值放在 .env.development.local，已 gitignore）。
   *
   * 为什么这么做：
   *   1. ApiKey 不下发浏览器 = 不会被人从 dist 里抠出来；
   *   2. 浏览器只和本地 5173 说话（同源），彻底绕开 CORS 预检；
   *   3. 正式环境应由后端网关承担同一职责（前端只调自己的后端）。
   */
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.CMP_API_TARGET || 'http://192.168.77.15:82'
  const apiId = env.CMP_API_ID || ''
  const apiKey = env.CMP_API_KEY || ''

  // 只在跑 dev server 时提示；build 不打代理，缺密钥是正常的，不必刷屏
  if (command === 'serve' && (!apiId || !apiKey)) {
    console.warn(
      '[vite] ⚠️ 未读到 CMP_API_ID / CMP_API_KEY：/api 代理不会带鉴权头，后端会把请求跳转到它自己的登录页。\n' +
        '        请在项目根目录的 .env.development.local 里配置（该文件已 gitignore）。'
    )
  }

  return {
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
      /**
       * host: true = 监听 0.0.0.0，局域网内其他机器可以直接打开
       *   例：后端同事访问 http://192.168.77.6:5173 看到的就是我本地最新的代码。
       * 注意：暴露到局域网后，后端按 Origin/Referer 做域名白名单，
       *   而白名单里只录了 http://localhost:5173，所以下面代理把这两个头改写掉。
       */
      host: true,
      port: 5173,
      // 启动后自动打开浏览器，跟隔壁 web-portal 一样；不想自动开就改回 false
      open: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          /**
           * 鉴权头在这里统一加上（http-proxy 的 headers 选项 = 附加到转发请求上）。
           * 前端代码里因此完全看不到 ApiId/ApiKey。
           */
          headers: {
            ApiId: apiId,
            ApiKey: apiKey,
            /**
             * 后端用 Origin/Referer 判域名白名单，只认 http://localhost:5173。
             * 用局域网 IP（192.168.77.6:5173）打开时，浏览器会带
             * Origin: http://192.168.77.6:5173 → 后端回 403「域名未授权」。
             * 这里统一改写成已白名单的 localhost。
             *
             * 必须写在 headers 里：实测 configure/proxyReq.setHeader 对这两个头
             * 不生效（会被原请求头覆盖），只有 http-proxy 的 headers 选项可靠。
             * 只作用于 dev server 的代理，生产构建不受影响。
             *
             * 更正规的做法是让后端把 http://192.168.77.6:5173 加进白名单，
             * 那样这两行就可以删掉。
             */
            Origin: 'http://localhost:5173',
            Referer: 'http://localhost:5173/'
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1500
    }
  }
})
