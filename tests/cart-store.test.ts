// 购物车 store 单元测试：mock 掉 service 层，验证全局件数状态的更新逻辑
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { ApiResponse } from '@/utils/request'
import type { CartItem } from '@/service/types'

vi.mock('@/service/cart', () => ({ getCart: vi.fn() }))

import { getCart } from '@/service/cart'
import { useCartStore } from '@/stores/cart'

const cartResponse = (items: CartItem[]): ApiResponse<CartItem[]> => ({
  resultCode: 200,
  message: 'SUCCESS',
  data: items,
})

const item = (cartItemId: number, goodsCount = 1): CartItem => ({
  cartItemId,
  goodsId: 10000 + cartItemId,
  goodsName: `商品${cartItemId}`,
  goodsCoverImg: '',
  sellingPrice: 100,
  goodsCount,
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('stores/cart', () => {
  it('初始 count 为 0', () => {
    expect(useCartStore().count).toBe(0)
  })

  it('updateCart 把 count 置为购物车条目数（与商品数量无关）', async () => {
    vi.mocked(getCart).mockResolvedValue(cartResponse([item(1, 5), item(2)]))
    const cart = useCartStore()
    await cart.updateCart()
    // 徽标语义是"条目数"而非"件数"：两条记录即 2，哪怕第一条买了 5 件
    expect(cart.count).toBe(2)
    expect(getCart).toHaveBeenCalledTimes(1)
  })

  it('列表清空后 count 归零', async () => {
    const cart = useCartStore()
    vi.mocked(getCart).mockResolvedValue(cartResponse([item(1)]))
    await cart.updateCart()
    expect(cart.count).toBe(1)

    vi.mocked(getCart).mockResolvedValue(cartResponse([]))
    await cart.updateCart()
    expect(cart.count).toBe(0)
  })

  it('接口返回 data 缺省时按空列表处理', async () => {
    vi.mocked(getCart).mockResolvedValue({
      resultCode: 200,
      message: 'SUCCESS',
      data: undefined,
    } as unknown as ApiResponse<CartItem[]>)
    const cart = useCartStore()
    await cart.updateCart()
    expect(cart.count).toBe(0)
  })

  it('接口失败时 rejection 向上传播且 count 保持原值', async () => {
    const cart = useCartStore()
    vi.mocked(getCart).mockResolvedValue(cartResponse([item(1)]))
    await cart.updateCart()

    vi.mocked(getCart).mockRejectedValue(new Error('network'))
    await expect(cart.updateCart()).rejects.toThrow('network')
    expect(cart.count).toBe(1)
  })
})
