<!--
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 *
-->

<template>
  <van-swipe class="my-swipe" :autoplay="3000" indicator-color="#1baeae">
    <van-swipe-item v-for="(item, index) in list" :key="index">
      <img :src="item.carouselUrl" alt="" @click="goTo(item.redirectUrl)" />
    </van-swipe-item>
  </van-swipe>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/components/Swiper.vue 迁移而来。
// list 即首页接口返回的轮播数据（carouselUrl 图片地址 / redirectUrl 跳转链接）。
import type { Carousel } from '@/service/types'

withDefaults(
  defineProps<{
    list?: Carousel[]
  }>(),
  {
    list: () => [],
  },
)

const goTo = (url: string) => {
  window.open(url)
}
</script>

<style lang="scss" scoped>
.my-swipe {
  img {
    width: 100%;
    height: 100%;
  }
}
</style>
