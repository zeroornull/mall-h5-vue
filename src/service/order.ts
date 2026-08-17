/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

import request from '@/utils/request'
import type { Order, PageResult } from './types'

export interface CreateOrderParams {
  addressId: number
  cartItemIds: number[]
}

export interface OrderListParams {
  pageNumber?: number
  /** 按订单状态筛选，空串表示全部 */
  status?: number | string
}

export interface PayOrderParams {
  orderNo: string
  /** 1-微信 2-支付宝 */
  payType: number
}

/** 下单成功后 data 为订单号 */
export function createOrder(params: CreateOrderParams) {
  return request.post<string>('/saveOrder', params)
}

export function getOrderList(params: OrderListParams) {
  return request.get<PageResult<Order>>('/order', { params })
}

export function getOrderDetail(orderNo: string) {
  return request.get<Order>(`/order/${orderNo}`)
}

export function cancelOrder(orderNo: string) {
  return request.put(`/order/${orderNo}/cancel`)
}

export function confirmOrder(orderNo: string) {
  return request.put(`/order/${orderNo}/finish`)
}

export function payOrder(params: PayOrderParams) {
  return request.get('/paySuccess', { params })
}
