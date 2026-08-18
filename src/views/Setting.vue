<template>
  <div class="setting">
    <SimpleHeader name="账号设置" />

    <van-form class="form" @submit="onSave">
      <van-cell-group inset>
        <van-field
          v-model="nickName"
          name="nickName"
          label="昵称"
          placeholder="请输入昵称"
          :rules="[{ required: true, message: '请填写昵称' }]"
        />
        <van-field
          v-model="introduceSign"
          name="introduceSign"
          label="个性签名"
          placeholder="请输入个性签名"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="新密码"
          placeholder="留空则不修改密码"
        />
      </van-cell-group>
      <div class="btns">
        <van-button round block color="#1baeae" native-type="submit">
          保存
        </van-button>
        <van-button
          round
          block
          plain
          type="danger"
          class="logout"
          @click="onLogout"
        >
          退出登录
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Setting.vue 迁移而来。
// 密码留空则不修改；退出登录后清 token 与购物车徽标，跳登录页
// （请求层实时读 token，无需原实现的整页刷新）。
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { md5 } from 'js-md5'
import { closeToast, showLoadingToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'
import { editUserInfo, getUserInfo, logout } from '@/service/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cart = useCartStore()

const nickName = ref('')
const introduceSign = ref('')
const password = ref('')

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getUserInfo()
    nickName.value = data.nickName
    introduceSign.value = data.introduceSign
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    closeToast()
  }
})

const onSave = async () => {
  try {
    await editUserInfo({
      nickName: nickName.value,
      introduceSign: introduceSign.value,
      ...(password.value ? { passwordMd5: md5(password.value) } : {}),
    })
    password.value = ''
    showSuccessToast('修改成功')
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onLogout = async () => {
  try {
    await logout()
  } catch {
    // 即使接口失败也继续本地登出
  }
  window.localStorage.removeItem('token')
  // 清空全局购物车徽标，避免登出后残留旧值
  cart.count = 0
  router.push({ path: '/login' })
}
</script>

<style lang="scss" scoped>
.setting {
  min-height: 100vh;
  background: #f7f8fa;
}

.form {
  padding-top: 15px;
}

.btns {
  margin: 25px 16px;

  .logout {
    margin-top: 12px;
  }
}
</style>
