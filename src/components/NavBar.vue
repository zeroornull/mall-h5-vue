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
  <nav class="nav-bar van-hairline--top">
    <router-link
      class="nav-list-item"
      to="/home"
    >
      <van-icon name="wap-home-o" />
      <span>首页</span>
    </router-link>
    <router-link
      class="nav-list-item"
      to="/category"
    >
      <van-icon name="apps-o" />
      <span>分类</span>
    </router-link>
    <router-link
      class="nav-list-item"
      to="/cart"
    >
      <van-icon
        name="shopping-cart-o"
        :badge="cart.count || ''"
      />
      <span>购物车</span>
    </router-link>
    <router-link
      class="nav-list-item"
      to="/user"
    >
      <van-icon name="user-o" />
      <span>我的</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/components/NavBar.vue 迁移而来，主要改动：
// - nbicon CDN 字体图标换成 vant 内置图标
// - to="home" 这类相对路径改为绝对路径，避免在带参数路由下解析出错
// - 当前项高亮直接利用 vue-router 自动加在匹配链接上的 router-link-active 类
import { onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { getLocal } from '@/utils'

const cart = useCartStore()

onMounted(() => {
  // 购物车接口需要登录态，未登录时不请求
  if (getLocal('token')) {
    cart.updateCart()
  }
})
</script>

<style lang="scss" scoped>
// 新蜂主题色（原项目 theme.less 的 @primary）
$primary: #1baeae;

.nav-bar {
  position: fixed;
  left: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  width: 100%;
  padding: 5px 0;
  background: #fff;

  .nav-list-item {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    color: #666;
    font-size: 22px;
    text-decoration: none;

    &.router-link-active {
      color: $primary;
    }

    span {
      font-size: 12px;
    }

    .van-icon {
      margin-bottom: 2px;
    }
  }
}
</style>
