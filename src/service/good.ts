/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

import request from '@/utils/request'
import type { CategoryLevel1, Goods, GoodsDetail, PageResult } from './types'

export interface SearchParams {
  pageNumber?: number
  goodsCategoryId?: number | string
  keyword?: string
  /** 排序：'' 默认 / 'new' 新品 / 'price' 价格 */
  orderBy?: '' | 'new' | 'price'
}

export function getDetail(id: number | string) {
  return request.get<GoodsDetail>(`/goods/detail/${id}`)
}

export function getCategory() {
  return request.get<CategoryLevel1[]>('/categories')
}

export function search(params: SearchParams) {
  return request.get<PageResult<Goods>>('/search', { params })
}
