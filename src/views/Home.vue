<template>
  <div class="home">
    <header class="home-header" :class="{ active: headerScroll }">
      <router-link class="menu" to="/category">
        <van-icon name="wap-nav" />
      </router-link>
      <div class="header-search" @click="goToSearch">
        <span class="app-name">新蜂商城</span>
        <van-icon class="search-icon" name="search" />
        <span class="search-title">山河无恙，人间皆安</span>
      </div>
      <router-link v-if="!isLogin" class="login" to="/login">登录</router-link>
      <router-link v-else class="login" to="/user">
        <van-icon name="manager-o" />
      </router-link>
    </header>

    <Swiper :list="carousels" />

    <div class="category-list">
      <div
        v-for="item in categoryList"
        :key="item.name"
        class="category-item"
        @click="tips"
      >
        <van-icon :name="item.icon" :style="{ color: item.color }" />
        <span>{{ item.name }}</span>
      </div>
    </div>

    <div class="good">
      <header class="good-header">新品上线</header>
      <van-skeleton title :row="3" :loading="loading">
        <div class="good-box">
          <div
            v-for="item in newGoodses"
            :key="item.goodsId"
            class="good-item"
            @click="goToDetail(item)"
          >
            <img :src="$filters.prefix(item.goodsCoverImg)" alt="" />
            <div class="good-desc">
              <div class="title">{{ item.goodsName }}</div>
              <div class="price">￥{{ item.sellingPrice }}</div>
            </div>
          </div>
        </div>
      </van-skeleton>
    </div>

    <div class="good">
      <header class="good-header">热门商品</header>
      <van-skeleton title :row="3" :loading="loading">
        <div class="good-box">
          <div
            v-for="item in hotGoodses"
            :key="item.goodsId"
            class="good-item"
            @click="goToDetail(item)"
          >
            <img :src="$filters.prefix(item.goodsCoverImg)" alt="" />
            <div class="good-desc">
              <div class="title">{{ item.goodsName }}</div>
              <div class="price">￥{{ item.sellingPrice }}</div>
            </div>
          </div>
        </div>
      </van-skeleton>
    </div>

    <div class="good good--last">
      <header class="good-header">最新推荐</header>
      <van-skeleton title :row="3" :loading="loading">
        <div class="good-box good-box--wide">
          <div
            v-for="item in recommendGoodses"
            :key="item.goodsId"
            class="good-item"
            @click="goToDetail(item)"
          >
            <img :src="$filters.prefix(item.goodsCoverImg)" alt="" />
            <div class="good-desc">
              <div class="title">{{ item.goodsName }}</div>
              <div class="price">￥{{ item.sellingPrice }}</div>
            </div>
          </div>
        </div>
      </van-skeleton>
    </div>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Home.vue 迁移而来，主要改动：
// - 分类快捷入口的 CDN 图标换成 vant 内置图标（离线可用）
// - 原实现的 scroll 监听未在卸载时移除，这里补上 onUnmounted 清理
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showToast } from 'vant'
import 'vant/es/toast/style'
import { getHome } from '@/service/home'
import { getLocal } from '@/utils'
import type { Carousel, Goods } from '@/service/types'

const router = useRouter()

// 登录后整页刷新，此处无需响应式
const isLogin = !!getLocal('token')

const headerScroll = ref(false)
const loading = ref(true)
const carousels = ref<Carousel[]>([])
const newGoodses = ref<Goods[]>([])
const hotGoodses = ref<Goods[]>([])
const recommendGoodses = ref<Goods[]>([])

// 写死的分类快捷入口（原项目此处也是前端固定数据，仅图标来源不同）
const categoryList = [
  { name: '新蜂超市', icon: 'shop-o', color: '#ff5f5f' },
  { name: '新蜂服饰', icon: 'bag-o', color: '#5a7dff' },
  { name: '全球购', icon: 'gem-o', color: '#8a67c2' },
  { name: '新蜂生鲜', icon: 'flower-o', color: '#4aa3a0' },
  { name: '新蜂到家', icon: 'home-o', color: '#ff9c6e' },
  { name: '充值缴费', icon: 'credit-pay', color: '#4a90d9' },
  { name: '9.9元拼', icon: 'fire-o', color: '#d9534f' },
  { name: '领劵', icon: 'coupon-o', color: '#e0719c' },
  { name: '省钱', icon: 'gold-coin-o', color: '#c2855a' },
  { name: '全部', icon: 'apps-o', color: '#1baeae' },
]

// 滚动超过 100px 时 header 从透明变为主题色背景
const onScroll = () => {
  headerScroll.value = window.scrollY > 100
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll)

  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getHome()
    carousels.value = data.carousels
    newGoodses.value = data.newGoodses
    hotGoodses.value = data.hotGoodses
    recommendGoodses.value = data.recommendGoodses
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false
    closeToast()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})

const goToSearch = () => {
  router.push({ path: '/product-list', query: { from: 'home' } })
}

const goToDetail = (item: Goods) => {
  router.push({ path: `/product/${item.goodsId}` })
}

const tips = () => {
  showToast('敬请期待')
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.home {
  // 底部固定 NavBar 的占位
  padding-bottom: 70px;
}

.home-header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  padding: 0 15px;
  transition: background 0.3s;

  .menu,
  .login {
    color: #fff;
    font-size: 22px;

    .van-icon {
      vertical-align: middle;
    }
  }

  .login {
    font-size: 14px;
    text-decoration: none;
  }

  .header-search {
    display: flex;
    flex: 1;
    align-items: center;
    margin: 0 12px;
    padding: 4px 0;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 20px;
    line-height: 22px;

    .app-name {
      padding: 0 10px;
      color: $primary;
      font-size: 18px;
      font-weight: bold;
      border-right: 1px solid #666;
    }

    .search-icon {
      padding: 0 8px;
      font-size: 16px;
      color: #666;
    }

    .search-title {
      color: #666;
      font-size: 12px;
    }
  }

  &.active {
    background: $primary;
  }
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  padding: 10px 0;

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20%;
    padding: 10px 0;

    .van-icon {
      font-size: 28px;
    }

    span {
      margin-top: 6px;
      color: #333;
      font-size: 12px;
    }
  }
}

.good {
  .good-header {
    height: 50px;
    color: $primary;
    font-size: 16px;
    font-weight: 500;
    line-height: 50px;
    text-align: center;
    background: #f9f9f9;
  }

  .good-box {
    display: flex;
    flex-wrap: wrap;

    .good-item {
      box-sizing: border-box;
      width: 33.3333%;
      padding: 10px;
      border-bottom: 1px solid #e9e9e9;

      img {
        display: block;
        width: 100%;
        margin: 0 auto;
      }

      .good-desc {
        padding: 10px 0 0;
        font-size: 14px;
        text-align: center;

        .title {
          overflow: hidden;
          color: #222333;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .price {
          margin-top: 4px;
          color: $primary;
        }
      }

      &:nth-child(3n + 1),
      &:nth-child(3n + 2) {
        border-right: 1px solid #e9e9e9;
      }
    }

    // 最新推荐：两列大图
    &--wide .good-item {
      width: 50%;

      &:nth-child(3n + 1),
      &:nth-child(3n + 2) {
        border-right: none;
      }

      &:nth-child(odd) {
        border-right: 1px solid #e9e9e9;
      }
    }
  }

  // 骨架屏内容留白
  .van-skeleton {
    padding: 10px 15px;
  }
}
</style>
