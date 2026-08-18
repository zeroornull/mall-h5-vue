<template>
  <div class="order">
    <SimpleHeader name="我的订单" back="/user" />

    <van-tabs
      v-model:active="status"
      class="tabs"
      color="#1baeae"
      title-active-color="#1baeae"
      @change="onTabChange"
    >
      <van-tab title="全部" name="" />
      <van-tab title="待付款" name="0" />
      <van-tab title="待确认" name="1" />
      <van-tab title="待发货" name="2" />
      <van-tab title="已发货" name="3" />
      <van-tab title="交易完成" name="4" />
    </van-tabs>

    <div class="content">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        :finished-text="list.length ? '没有更多了' : ''"
        @load="onLoad"
      >
        <div
          v-for="order in list"
          :key="order.orderNo"
          class="order-item"
          @click="goToDetail(order)"
        >
          <div class="item-header van-hairline--bottom">
            <span class="time">{{ order.createTime }}</span>
            <span class="status">{{ order.orderStatusString }}</span>
          </div>
          <div
            v-for="goods in order.newBeeMallOrderItemVOS"
            :key="goods.cartItemId"
            class="goods-line"
          >
            <img class="cover" :src="$filters.prefix(goods.goodsCoverImg)" />
            <div class="info">
              <div class="title">{{ goods.goodsName }}</div>
              <div class="meta">
                <span>￥{{ goods.sellingPrice }}</span>
                <span class="count">x{{ goods.goodsCount }}</span>
              </div>
            </div>
          </div>
          <div class="item-footer">
            共 {{ orderCount(order) }} 件，合计
            <span class="total">￥{{ order.totalPrice }}</span>
          </div>
        </div>
        <van-empty v-if="finished && !list.length" description="暂无订单" />
      </van-list>
    </div>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Order.vue 迁移而来。
// 每个状态 Tab 独立分页：切换即重置四状态（list/page/totalPage/finished）重新加载，
// 复用商品列表页的 van-list 无限滚动模式。
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderList } from '@/service/order'
import type { Order } from '@/service/types'

const router = useRouter()

/** 当前状态筛选：'' 全部 / '0' 待付款 / '1' 待确认 / '2' 待发货 / '3' 已发货 / '4' 交易完成 */
const status = ref('')

const list = ref<Order[]>([])
const page = ref(1)
const totalPage = ref(0)
const loading = ref(false)
const finished = ref(false)

const onLoad = async () => {
  try {
    const { data } = await getOrderList({
      pageNumber: page.value,
      status: status.value,
    })
    list.value = list.value.concat(data.list)
    totalPage.value = data.totalPage
    if (page.value >= data.totalPage) {
      finished.value = true
    } else {
      page.value += 1
    }
  } catch {
    // 错误提示由请求拦截器统一弹出
    finished.value = true
  } finally {
    loading.value = false
  }
}

const onTabChange = () => {
  list.value = []
  page.value = 1
  totalPage.value = 0
  finished.value = false
  loading.value = true
  onLoad()
}

const orderCount = (order: Order) =>
  order.newBeeMallOrderItemVOS.reduce((sum, item) => sum + item.goodsCount, 0)

const goToDetail = (order: Order) => {
  router.push({ path: '/order-detail', query: { orderNo: order.orderNo } })
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.tabs {
  position: fixed;
  top: 44px;
  left: 0;
  z-index: 1000;
  width: 100%;
}

.content {
  // SimpleHeader 占位 44px 之外再空出 tabs 的 44px
  padding-top: 44px;
  min-height: calc(100vh - 88px);
  background: #f7f8fa;

  .order-item {
    margin: 10px 15px;
    padding: 0 12px;
    background: #fff;
    border-radius: 8px;

    .item-header {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 13px;
      color: #666;

      .status {
        color: $primary;
      }
    }

    .goods-line {
      display: flex;
      padding: 10px 0;

      .cover {
        width: 60px;
        height: 60px;
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
          color: #666;
          font-size: 13px;

          .count {
            color: #999;
          }
        }
      }
    }

    .item-footer {
      padding: 10px 0 12px;
      color: #666;
      font-size: 13px;
      text-align: right;

      .total {
        color: #222333;
        font-size: 15px;
        font-weight: 500;
      }
    }
  }
}
</style>
