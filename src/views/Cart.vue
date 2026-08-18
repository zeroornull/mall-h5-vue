<template>
  <div class="cart">
    <SimpleHeader name="购物车" noback />

    <div class="cart-body">
      <van-checkbox-group v-model="checkedIds" checked-color="#1baeae">
        <van-swipe-cell v-for="item in list" :key="item.cartItemId">
          <div class="cart-item van-hairline--bottom">
            <van-checkbox class="check" :name="item.cartItemId" />
            <img class="cover" :src="$filters.prefix(item.goodsCoverImg)" />
            <div class="info">
              <div class="title">{{ item.goodsName }}</div>
              <div class="bottom">
                <div class="price">￥{{ item.sellingPrice }}</div>
                <van-stepper
                  :model-value="item.goodsCount"
                  :min="1"
                  :max="5"
                  integer
                  @change="(value) => onCountChange(item, Number(value))"
                />
              </div>
            </div>
          </div>
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              class="delete-btn"
              @click="onDelete(item)"
            />
          </template>
        </van-swipe-cell>
      </van-checkbox-group>

      <van-empty v-if="!loading && !list.length" description="购物车空空如也">
        <van-button
          round
          color="#1baeae"
          class="go-shopping"
          @click="router.push({ path: '/home' })"
        >
          前往购物
        </van-button>
      </van-empty>
    </div>

    <van-submit-bar
      v-if="list.length"
      class="submit-bar"
      :price="totalPrice * 100"
      button-text="结算"
      button-color="#1baeae"
      @submit="onSubmit"
    >
      <van-checkbox v-model="checkedAll" checked-color="#1baeae">
        全选
      </van-checkbox>
    </van-submit-bar>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Cart.vue 迁移而来。
// 勾选状态只存本页（checkedIds），件数徽标走 Pinia 全局（cart.count）；
// 数量与删除的写操作以服务端为准，失败时重新拉取列表回滚本地状态。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { deleteCartItem, getCart, modifyCart } from '@/service/cart'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/service/types'

const router = useRouter()
const cart = useCartStore()

const list = ref<CartItem[]>([])
const checkedIds = ref<number[]>([])
const loading = ref(true)

/** 拉取列表并默认全选（进入页面、删除后、写操作失败回滚时统一走这里） */
const loadCart = async () => {
  loading.value = true
  try {
    const { data } = await getCart()
    list.value = data
    checkedIds.value = data.map((item) => item.cartItemId)
  } catch {
    // 错误提示由请求拦截器统一弹出（未登录 416 会被踢去登录页）
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  await loadCart()
  closeToast()
})

/** 全选与单项复选框双向联动 */
const checkedAll = computed({
  get: () =>
    list.value.length > 0 && checkedIds.value.length === list.value.length,
  set: (checked: boolean) => {
    checkedIds.value = checked ? list.value.map((item) => item.cartItemId) : []
  },
})

/** 勾选项合计（元） */
const totalPrice = computed(() =>
  list.value
    .filter((item) => checkedIds.value.includes(item.cartItemId))
    .reduce((sum, item) => sum + item.sellingPrice * item.goodsCount, 0),
)

const onCountChange = async (item: CartItem, goodsCount: number) => {
  if (goodsCount === item.goodsCount) return
  try {
    await modifyCart({ cartItemId: item.cartItemId, goodsCount })
    item.goodsCount = goodsCount
  } catch {
    // 服务端拒绝（如超出上限）时回滚为服务端状态
    await loadCart()
  }
}

const onDelete = async (item: CartItem) => {
  try {
    await deleteCartItem(item.cartItemId)
    await loadCart()
    // 全局徽标同步扣减
    await cart.updateCart()
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onSubmit = () => {
  if (!checkedIds.value.length) {
    showToast('请选择商品进行结算')
    return
  }
  router.push({
    path: '/create-order',
    query: { cartItemIds: checkedIds.value.join(',') },
  })
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.cart-body {
  // 底部依次是 submit-bar（50px）与 NavBar（约 50px）
  padding-bottom: 110px;

  .cart-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    background: #fff;

    .check {
      margin-right: 10px;
    }

    .cover {
      width: 90px;
      height: 90px;
      border-radius: 4px;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
      align-self: stretch;
      margin-left: 10px;
      padding: 5px 0;
      overflow: hidden;

      .title {
        color: #222333;
        font-size: 14px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .price {
          color: $primary;
          font-size: 16px;
          font-weight: 500;
        }
      }
    }
  }

  .delete-btn {
    height: 100%;
  }

  .go-shopping {
    width: 140px;
  }
}

// 抬到 NavBar 上方
.submit-bar {
  bottom: 50px;
}
</style>
