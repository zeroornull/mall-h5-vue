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
import { create, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { showFailToast } from 'vant'
import 'vant/es/toast/style'
import { getLocal } from './index'

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  resultCode: number
  message: string
  data: T
}

// 原官方线上后端已停止服务，统一请求同源的 /api/v1，
// 由本地 Mock 或 vite 代理响应；接入真实后端时改这里或配置代理即可
const instance = create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
})

instance.interceptors.request.use((config) => {
  config.headers['token'] = getLocal('token') ?? ''
  return config
})

instance.interceptors.response.use((res) => {
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
})

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
