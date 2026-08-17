import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { mockApi } from './mock/api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 模板中的 van-xxx 组件按需自动引入（连带样式），组件类型声明生成到 src/components.d.ts
    Components({
      dts: 'src/components.d.ts',
      resolvers: [VantResolver()],
    }),
    // dev 环境的本地 Mock 后端，见 mock/api.ts；接真实后端时移除并配置 server.proxy
    mockApi(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
