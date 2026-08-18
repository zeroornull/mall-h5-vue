<template>
  <div class="user">
    <SimpleHeader name="个人中心" noback />

    <div class="user-info">
      <van-icon class="avatar" name="user-circle-o" />
      <div class="meta">
        <div class="nick">{{ user?.nickName ?? '…' }}</div>
        <div class="sign">{{ user?.introduceSign }}</div>
      </div>
    </div>

    <van-cell-group class="menu" inset>
      <van-cell
        title="我的订单"
        icon="orders-o"
        is-link
        @click="router.push({ path: '/order' })"
      />
      <van-cell
        title="地址管理"
        icon="location-o"
        is-link
        @click="router.push({ path: '/address' })"
      />
      <van-cell
        title="账号设置"
        icon="setting-o"
        is-link
        @click="router.push({ path: '/setting' })"
      />
      <van-cell
        title="关于我们"
        icon="info-o"
        is-link
        @click="router.push({ path: '/about' })"
      />
    </van-cell-group>

    <NavBar />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/User.vue 迁移而来。
// 原版 CDN 头像图已停服，改用 vant 内置图标；
// 未登录访问时 getUserInfo 返回 416，请求拦截器自动跳转 /login。
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { closeToast, showLoadingToast } from 'vant'
import 'vant/es/toast/style'
import { getUserInfo } from '@/service/user'
import type { UserInfo } from '@/service/types'

const router = useRouter()

const user = ref<UserInfo | null>(null)

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getUserInfo()
    user.value = data
  } catch {
    // 416 跳转与错误提示均由请求拦截器统一处理
  } finally {
    closeToast()
  }
})
</script>

<style lang="scss" scoped>
.user {
  min-height: 100vh;
  background: #f7f8fa;
}

.user-info {
  display: flex;
  align-items: center;
  margin: 15px;
  padding: 20px 15px;
  color: #fff;
  background: linear-gradient(90deg, #1baeae, #51c7c7);
  border-radius: 8px;

  .avatar {
    font-size: 54px;
  }

  .meta {
    margin-left: 12px;
    overflow: hidden;

    .nick {
      font-size: 18px;
      font-weight: bold;
    }

    .sign {
      margin-top: 6px;
      font-size: 13px;
      opacity: 0.85;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.menu {
  // NavBar 占位
  margin-bottom: 70px;
}
</style>
