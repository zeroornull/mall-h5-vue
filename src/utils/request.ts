/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

// 由 newbee-mall-vue3-app 的 src/utils/axios.js 迁移而来，主要改动：
// - 改用 axios.create 创建独立实例，不再污染全局 axios 默认配置
// - token 在请求拦截器里实时读取 localStorage，登录/登出后无需刷新页面即可生效
//   （原实现把 token 写死在模块加载时的默认请求头里，登录后必须整页刷新）
// - 响应经拦截器解包为统一的 ApiResponse<T>，业务方直接拿到带类型的数据
// - GET 重复请求自动取消：同指纹（方法+地址+参数）请求未返回时再次发起，
//   取消前一个，避免竞态下旧响应覆盖新响应
// - GET 网络错误/超时/5xx 自动重试（指数退避，最多 2 次）。
//   两者均不作用于写操作：取消拦不住服务端已执行，重试会重复副作用（如重复下单），
//   写操作防重应依赖按钮禁用与服务端幂等
import {
  create,
  isCancel,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { showFailToast } from 'vant'
import 'vant/es/toast/style'
import { getLocal } from './index'

// 在 axios 配置上扩展重试计数字段
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 当前已重试次数（内部使用） */
    _retryCount?: number
  }
}

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  resultCode: number
  message: string
  data: T
}

const MAX_RETRIES = 2
const RETRY_BASE_DELAY = 300

// 原官方线上后端已停止服务，统一请求同源的 /api/v1，
// 由本地 Mock 或 vite 代理响应；接入真实后端时改这里或配置代理即可
const instance = create({
  baseURL: '/api/v1',
  timeout: 10000,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

/** 进行中的 GET 请求：指纹 -> 取消控制器 */
const pendingGets = new Map<string, AbortController>()

const requestKey = (config: InternalAxiosRequestConfig) =>
  [config.method, config.url, JSON.stringify(config.params ?? {})].join('&')

instance.interceptors.request.use((config) => {
  // 动态取 token：每次请求实时读取，登录/登出立即生效
  config.headers['token'] = getLocal('token') ?? ''

  // GET 重复请求自动取消（调用方已显式传 signal 时尊重调用方，不接管）
  if (config.method === 'get' && !config.signal) {
    const key = requestKey(config)
    pendingGets.get(key)?.abort()
    const controller = new AbortController()
    config.signal = controller.signal
    pendingGets.set(key, controller)
  }
  return config
})

/** 网络层错误（无响应）、超时或 5xx 才值得重试 */
const isRetriable = (error: AxiosError) =>
  !error.response ||
  error.code === 'ECONNABORTED' ||
  error.response.status >= 500

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const clearPending = (config?: InternalAxiosRequestConfig) => {
  if (config?.method === 'get') pendingGets.delete(requestKey(config))
}

instance.interceptors.response.use(
  (res) => {
    clearPending(res.config)
    if (typeof res.data !== 'object' || res.data === null) {
      showFailToast('服务端异常！')
      return Promise.reject(res)
    }
    const payload = res.data as ApiResponse
    if (payload.resultCode !== 200) {
      if (payload.message) showFailToast(payload.message)
      if (payload.resultCode === 416) {
        // 未登录，跳转登录页。这里不依赖 router 实例，避免 request ↔ router 循环引用；
        // 项目接入 vue-router（hash 模式）后此写法同样会触发路由跳转
        window.location.hash = '#/login'
      }
      return Promise.reject(payload)
    }
    // 拦截器直接返回解包后的业务数据，类型由下方 Request 接口重新声明
    return payload as unknown as AxiosResponse
  },
  async (error: AxiosError) => {
    // 被取消的请求静默失败：它已被同指纹的新请求取代，不提示、
    // 也不清理 pending（记录已被新请求覆盖，清理反而会误删）
    if (isCancel(error)) {
      return Promise.reject(error)
    }
    clearPending(error.config as InternalAxiosRequestConfig | undefined)

    // GET 自动重试：指数退避 300ms、600ms；重新走请求拦截器（token/取消登记随之刷新）
    const config = error.config
    if (
      config?.method === 'get' &&
      (config._retryCount ?? 0) < MAX_RETRIES &&
      isRetriable(error)
    ) {
      config._retryCount = (config._retryCount ?? 0) + 1
      // 清掉上一轮的 signal，让请求拦截器为重试重新登记取消控制器
      config.signal = undefined
      await sleep(RETRY_BASE_DELAY * 2 ** (config._retryCount - 1))
      return instance(config)
    }

    showFailToast('网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

// 响应拦截器已把 AxiosResponse 解包成 ApiResponse，这里重新声明方法签名以获得准确类型
interface Request {
  get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>>
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>>
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>>
  delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>>
}

const request = instance as unknown as Request

export default request
