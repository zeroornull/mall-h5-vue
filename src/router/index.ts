/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

// 由 newbee-mall-vue3-app 的 src/router/index.js 迁移而来。
// Home 直接 import：随入口主包一起加载，首屏无需再发请求；
// 其余页面 () => import(...)：构建时被拆成独立 chunk，首次进入该路由才按需加载。
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import { getLocal } from '@/utils'

// meta.index 表示页面层级（1 主级 / 2 次级 / 3 三级），
// App.vue 根据层级变化决定转场方向（进入下级左滑、返回上级右滑）；
// meta.requiresAuth 标记需登录页面，由下方全局前置守卫拦截
declare module 'vue-router' {
  interface RouteMeta {
    index: number
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: Home,
      meta: { index: 1 },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { index: 1 },
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('@/views/User.vue'),
      meta: { index: 1, requiresAuth: true },
    },
    {
      path: '/product-list',
      name: 'product-list',
      component: () => import('@/views/ProductList.vue'),
      meta: { index: 2 },
    },
    {
      path: '/category',
      name: 'category',
      component: () => import('@/views/Category.vue'),
      meta: { index: 1 },
    },
    {
      path: '/product/:id',
      name: 'product',
      component: () => import('@/views/ProductDetail.vue'),
      meta: { index: 3 },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/views/Cart.vue'),
      meta: { index: 1, requiresAuth: true },
    },
    {
      path: '/create-order',
      name: 'create-order',
      component: () => import('@/views/CreateOrder.vue'),
      meta: { index: 2, requiresAuth: true },
    },
    {
      path: '/address',
      name: 'address',
      component: () => import('@/views/Address.vue'),
      meta: { index: 2, requiresAuth: true },
    },
    {
      path: '/address-edit',
      name: 'address-edit',
      component: () => import('@/views/AddressEdit.vue'),
      meta: { index: 3, requiresAuth: true },
    },
    {
      path: '/order',
      name: 'order',
      component: () => import('@/views/Order.vue'),
      meta: { index: 2, requiresAuth: true },
    },
    {
      path: '/order-detail',
      name: 'order-detail',
      component: () => import('@/views/OrderDetail.vue'),
      meta: { index: 3, requiresAuth: true },
    },
    {
      path: '/setting',
      name: 'setting',
      component: () => import('@/views/Setting.vue'),
      meta: { index: 2, requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/About.vue'),
      meta: { index: 2 },
    },
  ],
})

// 页面级鉴权：本地无 token 时直接拦下，免去一次注定 416 的请求；
// 带上 redirect，登录成功后回到原目标页。
// token 存在但已失效的场景仍由请求层的 416 拦截兜底（见 utils/request.ts）
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getLocal('token')) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

export default router
