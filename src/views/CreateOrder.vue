<template>
  <div class="create-order">
    <SimpleHeader name="生成订单" back="/cart" />

    <div class="address-wrap van-hairline--bottom" @click="goToAddressList">
      <template v-if="address">
        <div class="name">
          {{ address.userName }}
          <span class="phone">{{ address.userPhone }}</span>
        </div>
        <div class="detail">
          {{ address.provinceName }}{{ address.cityName }}{{ address.regionName
          }}{{ address.detailAddress }}
        </div>
      </template>
      <div v-else class="placeholder">请选择收货地址</div>
      <van-icon class="arrow" name="arrow" />
    </div>

    <div class="goods-list">
      <div
        v-for="item in list"
        :key="item.cartItemId"
        class="goods-item van-hairline--bottom"
      >
        <img class="cover" :src="$filters.prefix(item.goodsCoverImg)" />
        <div class="info">
          <div class="title">{{ item.goodsName }}</div>
          <div class="meta">
            <span class="price">￥{{ item.sellingPrice }}</span>
            <span class="count">x{{ item.goodsCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <van-submit-bar
      :price="total * 100"
      button-text="生成订单"
      button-color="#1baeae"
      @submit="onSubmit"
    />

    <!-- 关闭弹窗（含支付完成后的主动关闭）统一在 closed 回调跳订单列表：
         订单在弹窗出现前就已生成，未支付关闭对应"待支付"订单 -->
    <van-popup
      v-model:show="showPay"
      position="bottom"
      round
      closeable
      @closed="onPayPanelClosed"
    >
      <div class="pay-panel">
        <div class="amount">￥{{ total }}</div>
        <van-button
          class="pay-btn"
          color="#04be02"
          block
          round
          @click="onPay(1)"
        >
          微信支付
        </van-button>
        <van-button
          class="pay-btn"
          color="#4facfe"
          block
          round
          @click="onPay(2)"
        >
          支付宝支付
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/CreateOrder.vue 迁移而来。
// cartItemIds 首次由购物车经 query 传入并写入 localStorage：
// 去地址列表选址再返回时 query 只带 addressId，靠 localStorage 兜底恢复（原实现同款方案）。
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { getByCartItemIds } from '@/service/cart'
import { getAddressDetail, getDefaultAddress } from '@/service/address'
import { createOrder, payOrder } from '@/service/order'
import { useCartStore } from '@/stores/cart'
import { getLocal, setLocal } from '@/utils'
import type { Address, CartItem } from '@/service/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const list = ref<CartItem[]>([])
const address = ref<Address | null>(null)
const showPay = ref(false)
const orderNo = ref('')

const total = computed(() =>
  list.value.reduce(
    (sum, item) => sum + item.sellingPrice * item.goodsCount,
    0,
  ),
)

/** 结算条目 id 串：query 优先，其次 localStorage（地址选择往返场景） */
const resolveCartItemIds = (): string => {
  const fromQuery = route.query.cartItemIds as string | undefined
  if (fromQuery) {
    setLocal('cartItemIds', fromQuery)
    return fromQuery
  }
  return getLocal('cartItemIds') ?? ''
}

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const cartItemIds = resolveCartItemIds()
    const addressId = route.query.addressId as string | undefined

    const [goodsRes, addressRes] = await Promise.all([
      getByCartItemIds({ cartItemIds }),
      addressId ? getAddressDetail(addressId) : getDefaultAddress(),
    ])
    list.value = goodsRes.data
    address.value = addressRes.data
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    closeToast()
  }
})

const goToAddressList = () => {
  router.push({ path: '/address', query: { from: 'create-order' } })
}

const onSubmit = async () => {
  if (!address.value) {
    showToast('请选择收货地址')
    return
  }
  if (!list.value.length) {
    showToast('没有待结算的商品')
    return
  }
  try {
    const { data } = await createOrder({
      addressId: address.value.addressId,
      cartItemIds: list.value.map((item) => item.cartItemId),
    })
    orderNo.value = data
    // 订单已生成：结算条目已从购物车移除，清掉暂存并刷新徽标
    window.localStorage.removeItem('cartItemIds')
    cart.updateCart()
    showPay.value = true
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onPay = async (payType: number) => {
  try {
    await payOrder({ orderNo: orderNo.value, payType })
    showSuccessToast('支付成功')
    showPay.value = false
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

// 无论支付完成还是直接关闭弹窗，订单都已存在，统一去订单列表
const onPayPanelClosed = () => {
  router.push({ path: '/order' })
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.create-order {
  padding-bottom: 60px;
}

.address-wrap {
  position: relative;
  padding: 15px 40px 15px 15px;
  background: #fff;

  .name {
    color: #222333;
    font-size: 15px;
    font-weight: 500;

    .phone {
      margin-left: 10px;
      color: #666;
      font-weight: normal;
    }
  }

  .detail {
    margin-top: 6px;
    color: #666;
    font-size: 13px;
    line-height: 1.5;
  }

  .placeholder {
    padding: 8px 0;
    color: #999;
    font-size: 14px;
  }

  .arrow {
    position: absolute;
    top: 50%;
    right: 15px;
    color: #999;
    transform: translateY(-50%);
  }
}

.goods-list {
  margin-top: 10px;
  background: #fff;

  .goods-item {
    display: flex;
    padding: 10px 15px;

    .cover {
      width: 80px;
      height: 80px;
      border-radius: 4px;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-between;
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

      .meta {
        display: flex;
        justify-content: space-between;

        .price {
          color: $primary;
          font-size: 15px;
          font-weight: 500;
        }

        .count {
          color: #999;
          font-size: 13px;
        }
      }
    }
  }
}

.pay-panel {
  padding: 40px 20px 30px;

  .amount {
    margin-bottom: 20px;
    color: #222333;
    font-size: 26px;
    font-weight: bold;
    text-align: center;
  }

  .pay-btn {
    margin-top: 12px;
  }
}
</style>
