<template>
  <div class="login">
    <SimpleHeader :name="type === 'login' ? '登录' : '注册'" />
    <div class="logo">
      <van-icon name="shop-o" />
      <span>新蜂商城</span>
    </div>

    <div v-if="type === 'login'" class="login-body">
      <van-form @submit="onLogin">
        <van-field
          v-model="username"
          name="username"
          label="用户名"
          placeholder="用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password"
          type="password"
          name="password"
          label="密码"
          placeholder="密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <van-field
          v-model="verify"
          name="verify"
          label="验证码"
          placeholder="验证码"
          :rules="[{ required: true, message: '请填写验证码' }]"
        >
          <template #button>
            <VueImageVerify ref="verifyRef" />
          </template>
        </van-field>
        <div class="form-footer">
          <div class="link" @click="toggle('register')">立即注册</div>
          <van-button round block color="#1baeae" native-type="submit">
            登录
          </van-button>
        </div>
      </van-form>
    </div>

    <div v-else class="login-body">
      <van-form @submit="onRegister">
        <van-field
          v-model="username1"
          name="username1"
          label="用户名"
          placeholder="用户名"
          :rules="[{ required: true, message: '请填写用户名' }]"
        />
        <van-field
          v-model="password1"
          type="password"
          name="password1"
          label="密码"
          placeholder="密码"
          :rules="[{ required: true, message: '请填写密码' }]"
        />
        <van-field
          v-model="verify"
          name="verify"
          label="验证码"
          placeholder="验证码"
          :rules="[{ required: true, message: '请填写验证码' }]"
        >
          <template #button>
            <VueImageVerify ref="verifyRef" />
          </template>
        </van-field>
        <div class="form-footer">
          <div class="link" @click="toggle('login')">已有登录账号</div>
          <van-button round block color="#1baeae" native-type="submit">
            注册
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Login.vue 迁移而来：
// 登录 / 注册双模式，type 状态切换两套 van-form。
// 原 CDN logo 图已停服，改用 vant 内置图标 + 站名。
import { ref } from 'vue'
import { md5 } from 'js-md5'
import { showFailToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'
import VueImageVerify from '@/components/VueImageVerify.vue'
import { login, register } from '@/service/user'
import { setLocal } from '@/utils'

type Mode = 'login' | 'register'

const type = ref<Mode>('login')
const verifyRef = ref<InstanceType<typeof VueImageVerify> | null>(null)

// 登录表单
const username = ref('')
const password = ref('')
// 注册表单，与原实现一致使用独立字段
const username1 = ref('')
const password1 = ref('')
// 图形验证码输入，两个模式共用；切换模式时清空，验证码组件随 v-if 重新挂载生成新码
const verify = ref('')

const toggle = (target: Mode) => {
  type.value = target
  verify.value = ''
}

/** 与 canvas 验证码比对，不区分大小写 */
const checkVerify = (): boolean => {
  const code = verifyRef.value?.imgCode ?? ''
  if (!code || verify.value.toLowerCase() !== code.toLowerCase()) {
    showFailToast('验证码有误')
    return false
  }
  return true
}

const onLogin = async () => {
  if (!checkVerify()) return
  try {
    const { data: token } = await login({
      loginName: username.value,
      passwordMd5: md5(password.value),
    })
    setLocal('token', token)
    // 与原实现一致整页刷新回首页，顺带重置全部内存状态。
    // 本项目请求层每次请求实时读 token，router.push 其实也能生效，
    // 但原实现的 axios 默认头只在模块加载时读一次 token，必须强刷才能带上新 token
    window.location.href = '/'
  } catch {
    // 失败提示已由请求拦截器统一弹出
  }
}

const onRegister = async () => {
  if (!checkVerify()) return
  try {
    await register({
      loginName: username1.value,
      password: password1.value,
    })
    showSuccessToast('注册成功')
    toggle('login')
  } catch {
    // 失败提示已由请求拦截器统一弹出
  }
}
</script>

<style lang="scss" scoped>
.login {
  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 60px 0 40px;
    color: #1baeae;

    .van-icon {
      font-size: 60px;
    }

    span {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 2px;
    }
  }

  .login-body {
    padding: 0 20px;
  }

  .form-footer {
    margin: 16px;

    .link {
      display: inline-block;
      margin-bottom: 20px;
      font-size: 14px;
      color: #1989fa;
      cursor: pointer;
    }
  }
}
</style>
