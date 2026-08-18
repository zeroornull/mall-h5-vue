<template>
  <div class="product-list">
    <div class="header van-hairline--bottom">
      <van-icon class="back" name="arrow-left" @click="router.go(-1)" />
      <van-search
        v-model="keyword"
        class="search"
        shape="round"
        placeholder="请输入搜索关键词"
        @search="onSearch"
      />
    </div>

    <van-tabs
      v-model:active="orderBy"
      class="tabs"
      color="#1baeae"
      title-active-color="#1baeae"
      @change="onTabChange"
    >
      <van-tab title="推荐" name="" />
      <van-tab title="新品" name="new" />
      <van-tab title="价格" name="price" />
    </van-tabs>

    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :finished-text="list.length ? '没有更多了' : ''"
          @load="onLoad"
        >
          <div
            v-for="item in list"
            :key="item.goodsId"
            class="goods-item van-hairline--bottom"
            @click="goToDetail(item)"
          >
            <img class="cover" :src="$filters.prefix(item.goodsCoverImg)" />
            <div class="info">
              <div class="title">{{ item.goodsName }}</div>
              <div class="intro">{{ item.goodsIntro }}</div>
              <div class="price">￥{{ item.sellingPrice }}</div>
            </div>
          </div>
          <van-empty v-if="finished && !list.length" description="搜索为空" />
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/ProductList.vue 迁移而来。
// 三种入口：?keyword=xxx（搜索）、?categoryId=xxx（分类页）、?from=home（首页搜索框，
// 无过滤条件，直接展示全量推荐列表）。
// van-list 无限滚动四状态：page（下一页码）/ totalPage / loading / finished。
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search, type SearchParams } from '@/service/good'
import type { Goods } from '@/service/types'

const route = useRoute()
const router = useRouter()

const keyword = ref((route.query.keyword as string) ?? '')
/** 排序：'' 推荐 / 'new' 新品 / 'price' 价格，与 van-tab 的 name 对应 */
const orderBy = ref('')

const list = ref<Goods[]>([])
const page = ref(1)
const totalPage = ref(0)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

// van-list 触底自动调用（首屏不满一屏时也会自动补拉）
const onLoad = async () => {
  try {
    const { data } = await search({
      pageNumber: page.value,
      keyword: keyword.value,
      goodsCategoryId: (route.query.categoryId as string) ?? '',
      orderBy: orderBy.value as SearchParams['orderBy'],
    })
    // 下拉刷新时旧数据保留到新数据返回，此刻再清空，避免闪白屏
    if (refreshing.value) {
      list.value = []
      refreshing.value = false
    }
    list.value = list.value.concat(data.list)
    totalPage.value = data.totalPage
    if (page.value >= data.totalPage) {
      finished.value = true
    } else {
      page.value += 1
    }
  } catch {
    // 错误提示由请求拦截器统一弹出；置 finished 避免持续重试
    finished.value = true
  } finally {
    loading.value = false
  }
}

/** 搜索 / 切换排序共用：重置分页状态并主动拉第一页 */
const resetAndLoad = () => {
  list.value = []
  page.value = 1
  totalPage.value = 0
  finished.value = false
  loading.value = true
  onLoad()
}

const onSearch = () => {
  resetAndLoad()
}

const onTabChange = () => {
  resetAndLoad()
}

// 下拉刷新：回到第 1 页；数据清空延迟到 onLoad 返回时
const onRefresh = () => {
  page.value = 1
  totalPage.value = 0
  finished.value = false
  loading.value = true
  onLoad()
}

const goToDetail = (item: Goods) => {
  router.push({ path: `/product/${item.goodsId}` })
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

.header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  background: #fff;

  .back {
    padding: 0 5px 0 15px;
    color: #333;
    font-size: 20px;
  }

  .search {
    flex: 1;
    padding: 0 12px 0 5px;
  }
}

.tabs {
  position: fixed;
  top: 50px;
  left: 0;
  z-index: 1000;
  width: 100%;
}

.content {
  // header 50px + tabs 44px
  padding-top: 94px;
  min-height: 100vh;
  box-sizing: border-box;
  background: #fff;

  .goods-item {
    display: flex;
    padding: 10px 15px;

    .cover {
      width: 100px;
      height: 100px;
      border-radius: 4px;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      margin-left: 12px;
      overflow: hidden;

      .title {
        color: #222333;
        font-size: 15px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .intro {
        flex: 1;
        margin-top: 4px;
        color: #999;
        font-size: 12px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .price {
        color: $primary;
        font-size: 16px;
        font-weight: 500;
      }
    }
  }
}
</style>
