<template>
  <div class="category">
    <SimpleHeader name="分类" noback />

    <div class="category-body">
      <van-sidebar v-model="activeIndex" class="menu">
        <van-sidebar-item
          v-for="item in categories"
          :key="item.categoryId"
          :title="item.categoryName"
        />
      </van-sidebar>

      <div class="content">
        <div
          v-for="level2 in current?.secondLevelCategoryVOS"
          :key="level2.categoryId"
          class="section"
        >
          <div class="section-title">{{ level2.categoryName }}</div>
          <div class="grid">
            <div
              v-for="level3 in level2.thirdLevelCategoryVOS"
              :key="level3.categoryId"
              class="grid-item"
              @click="goToList(level3.categoryId)"
            >
              {{ level3.categoryName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Category.vue 迁移而来，主要改动：
// 原实现左右两列滚动依赖 better-scroll（数据异步返回后必须手动 refresh()
// 重新计算高度，否则滑不动）；本项目改用原生 overflow-y 滚动，无此问题，
// 原配套的通用滚动容器 ListScroll.vue 也随之省去。
// 左侧一级分类使用 vant 的 Sidebar 组件，选中态自带。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { closeToast, showLoadingToast } from 'vant'
import 'vant/es/toast/style'
import { getCategory } from '@/service/good'
import type { CategoryLevel1 } from '@/service/types'

const router = useRouter()

const categories = ref<CategoryLevel1[]>([])
const activeIndex = ref(0)
/** 左侧选中的一级分类，右侧渲染其下的二、三级 */
const current = computed(() => categories.value[activeIndex.value])

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getCategory()
    categories.value = data
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    closeToast()
  }
})

const goToList = (categoryId: number) => {
  router.push({ path: '/product-list', query: { categoryId } })
}
</script>

<style lang="scss" scoped>
$primary: #1baeae;

// 头部（44px 占位）与底部 NavBar 之间的区域，左右两列各自原生滚动
.category-body {
  position: fixed;
  top: 44px;
  bottom: 55px;
  left: 0;
  right: 0;
  display: flex;

  .menu {
    height: 100%;
    overflow-y: auto;
    --van-sidebar-selected-border-color: #{$primary};
    --van-sidebar-selected-text-color: #{$primary};
  }

  .content {
    flex: 1;
    height: 100%;
    padding: 0 10px;
    overflow-y: auto;
    background: #fff;

    .section {
      padding: 10px 0;

      .section-title {
        padding: 8px 5px;
        color: #333;
        font-size: 14px;
        font-weight: 500;
      }

      .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 5px;

        .grid-item {
          box-sizing: border-box;
          width: calc((100% - 20px) / 3);
          padding: 12px 4px;
          overflow: hidden;
          color: #555;
          font-size: 12px;
          white-space: nowrap;
          text-align: center;
          text-overflow: ellipsis;
          background: #f7f8fa;
          border-radius: 4px;
        }
      }
    }
  }
}
</style>
