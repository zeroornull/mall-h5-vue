<template>
  <div class="product-detail">
    <SimpleHeader name="商品详情" />

    <div v-if="detail" class="detail-body">
      <van-swipe class="swipe" :autoplay="3000" indicator-color="#1baeae">
        <van-swipe-item
          v-for="(img, index) in detail.goodsCarouselList"
          :key="index"
        >
          <img :src="$filters.prefix(img)" alt="" />
        </van-swipe-item>
      </van-swipe>

      <div class="info">
        <div class="price">￥{{ detail.sellingPrice }}</div>
        <div class="name">{{ detail.goodsName }}</div>
        <div class="intro">{{ detail.goodsIntro }}</div>
      </div>

      <div class="section-title van-hairline--bottom">商品介绍</div>
      <!-- 富文本详情来自自家后台运营录入（可信源），才允许 v-html 直出；
           它不做任何转义，若渲染用户生成内容会有 XSS 风险，须先经 DOMPurify 之类消毒 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="rich-content" v-html="detail.goodsDetailContent"></div>
    </div>

    <van-empty
      v-if="!loading && !detail"
      description="商品加载失败，请返回重试"
    />

    <van-action-bar v-if="detail">
      <van-action-bar-icon icon="chat-o" text="客服" @click="tips" />
      <van-action-bar-icon
        icon="cart-o"
        text="购物车"
        :badge="cart.count || ''"
        @click="router.push({ path: '/cart' })"
      />
      <van-action-bar-button
        type="warning"
        text="加入购物车"
        @click="onAddCart"
      />
      <van-action-bar-button
        color="#1baeae"
        text="立即购买"
        @click="onBuyNow"
      />
    </van-action-bar>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/ProductDetail.vue 迁移而来。
// 加购成功后调用 Pinia 的 cart.updateCart() 刷新全局件数，
// 底部购物车徽标（以及 NavBar 徽标）随之实时更新——全局状态的意义所在。
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showSuccessToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { getDetail } from '@/service/good'
import { addCart } from '@/service/cart'
import { useCartStore } from '@/stores/cart'
import type { GoodsDetail } from '@/service/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const detail = ref<GoodsDetail | null>(null)
const loading = ref(true)

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getDetail(route.params.id as string)
    detail.value = data
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false
    closeToast()
  }
})

/** 加购并刷新全局购物车件数；未登录时拦截器会踢去登录页 */
const doAddCart = async (): Promise<boolean> => {
  if (!detail.value) return false
  try {
    await addCart({ goodsId: detail.value.goodsId, goodsCount: 1 })
    await cart.updateCart()
    return true
  } catch {
    return false
  }
}

const onAddCart = async () => {
  if (await doAddCart()) {
    showSuccessToast('添加成功')
  }
}

const onBuyNow = async () => {
  if (await doAddCart()) {
    router.push({ path: '/cart' })
  }
}

const tips = () => {
  showToast('敬请期待')
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.product-detail {
  // van-action-bar 高度约 50px，留出空间
  padding-bottom: 60px;
}

.swipe {
  img {
    display: block;
    width: 100%;
  }
}

.info {
  padding: 12px 15px;
  background: #fff;

  .price {
    color: $primary;
    font-size: 22px;
    font-weight: bold;
  }

  .name {
    margin-top: 6px;
    color: #222333;
    font-size: 16px;
  }

  .intro {
    margin-top: 4px;
    color: #999;
    font-size: 13px;
  }
}

.section-title {
  margin-top: 10px;
  padding: 12px 15px;
  color: #222333;
  font-size: 15px;
  font-weight: 500;
  background: #fff;
}

.rich-content {
  background: #fff;

  :deep(img) {
    display: block;
    width: 100%;
  }
}
</style>
