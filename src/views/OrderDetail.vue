<template>
  <div class="order-detail">
    <SimpleHeader name="订单详情" back="/order" />

    <template v-if="detail">
      <div class="status-card">
        <div class="status">{{ detail.orderStatusString }}</div>
        <div class="row">订单编号：{{ detail.orderNo }}</div>
        <div class="row">下单时间：{{ detail.createTime }}</div>
        <div v-if="detail.payType" class="row">
          支付方式：{{ detail.payType === 1 ? '微信支付' : '支付宝支付' }}
        </div>
      </div>

      <div class="goods-card">
        <div
          v-for="goods in detail.newBeeMallOrderItemVOS"
          :key="goods.cartItemId"
          class="goods-line van-hairline--bottom"
        >
          <img class="cover" :src="$filters.prefix(goods.goodsCoverImg)" />
          <div class="info">
            <div class="title">{{ goods.goodsName }}</div>
            <div class="meta">
              <span class="price">￥{{ goods.sellingPrice }}</span>
              <span class="count">x{{ goods.goodsCount }}</span>
            </div>
          </div>
        </div>
        <div class="amount">
          实付款 <span class="total">￥{{ detail.totalPrice }}</span>
        </div>
      </div>

      <div
        v-if="detail.orderStatus === 0 || detail.orderStatus === 3"
        class="actions"
      >
        <template v-if="detail.orderStatus === 0">
          <van-button round block color="#1baeae" @click="showPay = true">
            去支付
          </van-button>
          <van-button round block plain class="secondary" @click="onCancel">
            取消订单
          </van-button>
        </template>
        <van-button v-else round block color="#1baeae" @click="onConfirm">
          确认收货
        </van-button>
      </div>
    </template>

    <van-empty
      v-if="!loading && !detail"
      description="订单加载失败，请返回重试"
    />

    <van-popup v-model:show="showPay" position="bottom" round closeable>
      <div class="pay-panel">
        <div class="amount">￥{{ detail?.totalPrice }}</div>
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
// 由 newbee-mall-vue3-app 的 src/views/OrderDetail.vue 迁移而来。
// 操作按钮按状态渲染：0 待付款可支付/取消，3 已发货可确认收货；
// 每次操作成功后重新拉取详情，状态与按钮随之刷新。
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  closeToast,
  showConfirmDialog,
  showLoadingToast,
  showSuccessToast,
} from 'vant'
import 'vant/es/toast/style'
import 'vant/es/dialog/style'
import {
  cancelOrder,
  confirmOrder,
  getOrderDetail,
  payOrder,
} from '@/service/order'
import type { Order } from '@/service/types'

const route = useRoute()

const orderNo = route.query.orderNo as string
const detail = ref<Order | null>(null)
const showPay = ref(false)
const loading = ref(true)

const loadDetail = async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getOrderDetail(orderNo)
    detail.value = data
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false
    closeToast()
  }
}

onMounted(loadDetail)

const onPay = async (payType: number) => {
  try {
    await payOrder({ orderNo, payType })
    showPay.value = false
    showSuccessToast('支付成功')
    await loadDetail()
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onCancel = async () => {
  try {
    await showConfirmDialog({ title: '确认取消该订单吗？' })
  } catch {
    return // 用户点了"取消"，不执行
  }
  try {
    await cancelOrder(orderNo)
    showSuccessToast('订单已取消')
    await loadDetail()
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onConfirm = async () => {
  try {
    await confirmOrder(orderNo)
    showSuccessToast('确认收货成功')
    await loadDetail()
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.order-detail {
  min-height: 100vh;
  background: #f7f8fa;
}

.status-card {
  margin: 10px 15px;
  padding: 15px;
  color: #fff;
  background: linear-gradient(90deg, #1baeae, #51c7c7);
  border-radius: 8px;

  .status {
    margin-bottom: 8px;
    font-size: 20px;
    font-weight: bold;
  }

  .row {
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.9;
  }
}

.goods-card {
  margin: 10px 15px;
  padding: 0 12px;
  background: #fff;
  border-radius: 8px;

  .goods-line {
    display: flex;
    padding: 12px 0;

    .cover {
      width: 70px;
      height: 70px;
      border-radius: 4px;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: space-around;
      margin-left: 10px;
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
        font-size: 13px;

        .price {
          color: $primary;
        }

        .count {
          color: #999;
        }
      }
    }
  }

  .amount {
    padding: 12px 0;
    color: #666;
    font-size: 13px;
    text-align: right;

    .total {
      color: #f63515;
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.actions {
  margin: 20px 15px;

  .secondary {
    margin-top: 10px;
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
