<template>
  <div class="user">
    <SimpleHeader name="个人中心" noback />
    <div class="user-info">
      <div class="nick">{{ user?.nickName ?? '…' }}</div>
      <div class="sign">{{ user?.introduceSign }}</div>
    </div>
    <NavBar />
  </div>
</template>

<script setup lang="ts">
// 个人中心完整功能后续迁移，当前先接入 getUserInfo：
// 未登录访问时接口返回 416，请求拦截器会自动跳转 /login
import { onMounted, ref } from 'vue'
import { getUserInfo } from '@/service/user'
import type { UserInfo } from '@/service/types'

const user = ref<UserInfo | null>(null)

onMounted(async () => {
  try {
    const { data } = await getUserInfo()
    user.value = data
  } catch {
    // 416 跳转与错误提示均由请求拦截器统一处理
  }
})
</script>

<style lang="scss" scoped>
.user-info {
  margin: 20px;
  padding: 20px;
  color: #fff;
  border-radius: 8px;
  background: linear-gradient(90deg, #1baeae, #51c7c7);

  .nick {
    font-size: 18px;
    font-weight: bold;
  }

  .sign {
    margin-top: 6px;
    font-size: 13px;
    opacity: 0.8;
  }
}
</style>
