<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/App.vue 迁移而来：
// 根据路由 meta.index 层级差决定转场方向——进入更深层左滑、返回上层右滑，
// 同层切换（底部 tab 之间）与首次进入不做动画。
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const router = useRouter()
const transitionName = ref('')

router.afterEach((to, from) => {
  // 首次导航时 from 为初始占位路由，meta.index 为 undefined
  const toIndex = to.meta.index
  const fromIndex = from.meta.index as number | undefined
  if (!fromIndex || toIndex === fromIndex) {
    transitionName.value = ''
  } else {
    transitionName.value = toIndex > fromIndex ? 'slide-left' : 'slide-right'
  }
})
</script>

<template>
  <!-- Vue Router 4 中 transition 需通过 v-slot 拿到匹配组件后包裹 -->
  <RouterView v-slot="{ Component }">
    <transition :name="transitionName">
      <component :is="Component" class="router-view" />
    </transition>
  </RouterView>
</template>

<style lang="scss">
// 转场类作用于各页面根元素，不能使用 scoped
.router-view {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
}

// 转场期间新旧页面同时存在，转为绝对定位使两者重叠滑动；
// 页面内 fixed 的头部/底栏会随 transform 容器一起滑动，正好形成整页滑动的观感
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  will-change: transform;
  backface-visibility: hidden;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

// slide-left（进入深层）：新页自右侧滑入，旧页向左滑出
// slide-right（返回上层）：方向相反
.slide-left-enter-from,
.slide-right-leave-to {
  transform: translate3d(100%, 0, 0);
  opacity: 0.6;
}

.slide-left-leave-to,
.slide-right-enter-from {
  transform: translate3d(-100%, 0, 0);
  opacity: 0.6;
}
</style>
