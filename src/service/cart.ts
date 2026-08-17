/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

import request from '@/utils/request'
import type { CartItem } from './types'

export interface AddCartParams {
  goodsId: number
  goodsCount?: number
}

export interface ModifyCartParams {
  cartItemId: number
  goodsCount: number
}

export function addCart(params: AddCartParams) {
  return request.post('/shop-cart', params)
}

export function modifyCart(params: ModifyCartParams) {
  return request.put('/shop-cart', params)
}

export function getCart(params?: { pageNumber?: number }) {
  return request.get<CartItem[]>('/shop-cart', { params })
}

export function deleteCartItem(id: number) {
  return request.delete(`/shop-cart/${id}`)
}

/** 按购物车条目 id 查询待结算商品，cartItemIds 为逗号分隔字符串 */
export function getByCartItemIds(params: { cartItemIds: string }) {
  return request.get<CartItem[]>('/shop-cart/settle', { params })
}
