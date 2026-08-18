import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.scss'
import App from './App.vue'
import router from './router'
import { prefix } from './utils'

// 沿用原项目的"全局过滤器"写法（Vue 3 以 globalProperties 模拟 Vue 2 的 filters），
// 模板中通过 $filters.prefix(...) 处理图片地址
const app = createApp(App)
app.config.globalProperties.$filters = { prefix }

declare module 'vue' {
  interface ComponentCustomProperties {
    $filters: { prefix: typeof prefix }
  }
}

app.use(createPinia()).use(router).mount('#app')
