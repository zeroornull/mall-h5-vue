import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// 独立于 vite.config.ts：单元测试不需要 vue 插件、vant 按需引入与本地 Mock，
// 只需对齐 '@' 别名；service/store 测试均不碰 DOM，node 环境即可
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
