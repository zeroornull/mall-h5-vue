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
  <header class="simple-header van-hairline--bottom">
    <van-icon
      v-if="!noback"
      name="arrow-left"
      class="header-side"
      @click="goBack"
    />
    <span
      v-else
      class="header-side"
    />
    <div class="simple-header-name">
      {{ name }}
    </div>
    <van-icon
      name="ellipsis"
      class="header-side header-side--more"
    />
  </header>
  <div class="header-placeholder" />
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/components/SimpleHeader.vue 迁移而来。
// 原组件的 nbicon 图标字体依赖阿里 CDN，这里改用 vant 内置图标，离线可用。
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    /** 标题 */
    name?: string
    /** 返回箭头跳转的目标路径，缺省时执行 router.go(-1) */
    back?: string
    /** 隐藏返回箭头（购物车等无上级页面的 tab 页使用） */
    noback?: boolean
  }>(),
  {
    name: '',
    back: '',
    noback: false,
  },
)

// 点击返回后通知父组件做清理（原组件行为，CreateOrder / OrderDetail 页面依赖）
const emit = defineEmits<{ callback: [] }>()

const router = useRouter()

const goBack = () => {
  if (props.back) {
    router.push({ path: props.back })
  } else {
    router.go(-1)
  }
  emit('callback')
}
</script>

<style lang="scss" scoped>
.simple-header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 10px;
  color: #252525;
  background: #fff;

  // 左右两侧等宽，保证标题始终居中
  .header-side {
    width: 24px;
    font-size: 16px;
  }

  .simple-header-name {
    font-size: 14px;
  }
}

// 头部 fixed 后脱离文档流，用等高占位块把页面内容顶下来
.header-placeholder {
  height: 44px;
}
</style>
