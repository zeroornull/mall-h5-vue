// 由 newbee-mall-vue3-app 的 src/stores/cart.js 迁移而来。
// 购物车全局状态：商品件数在底部导航徽标、购物车页等处共享。
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCart } from '@/service/cart'

export const useCartStore = defineStore('cart', () => {
  const count = ref(0)

  /** 拉取购物车列表并刷新件数（接口需要登录态） */
  async function updateCart() {
    const { data = [] } = await getCart()
    count.value = data.length
  }

  return { count, updateCart }
})
