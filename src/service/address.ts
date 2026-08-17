/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

import request from '@/utils/request'
import type { Address } from './types'

/** 新增地址入参（无 addressId，由后端生成） */
export type AddAddressParams = Omit<Address, 'addressId'>

export function addAddress(params: AddAddressParams) {
  return request.post('/address', params)
}

/** 编辑地址（原 EditAddress，统一为 camelCase 命名） */
export function editAddress(params: Address) {
  return request.put('/address', params)
}

/** 删除地址（原 DeleteAddress，统一为 camelCase 命名） */
export function deleteAddress(id: number | string) {
  return request.delete(`/address/${id}`)
}

/** 未设置默认地址时 data 为 null */
export function getDefaultAddress() {
  return request.get<Address | null>('/address/default')
}

export function getAddressList() {
  // 原实现把分页参数误当成 axios 配置传入（服务端实际收不到），这里改为正确的 params
  return request.get<Address[]>('/address', { params: { pageNumber: 1, pageSize: 1000 } })
}

export function getAddressDetail(id: number | string) {
  return request.get<Address>(`/address/${id}`)
}
