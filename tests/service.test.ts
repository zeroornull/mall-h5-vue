// service 层单元测试：service 是 axios 的薄封装，测试锁住与后端的接口约定
// ——URL、HTTP 方法、参数形态。request 模块整体 mock，不发真实请求。
import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => {
  // ok 必须定义在 hoisted 回调内：vi.mock 工厂被提升到文件顶部执行，
  // 早于模块级代码，外层定义反而不可用
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  const ok = async () => ({ resultCode: 200, message: 'SUCCESS', data: null })
  return {
    get: vi.fn(ok),
    post: vi.fn(ok),
    put: vi.fn(ok),
    delete: vi.fn(ok),
  }
})

vi.mock('@/utils/request', () => ({ default: request }))

import {
  editUserInfo,
  getUserInfo,
  login,
  logout,
  register,
} from '@/service/user'
import {
  addCart,
  deleteCartItem,
  getByCartItemIds,
  getCart,
  modifyCart,
} from '@/service/cart'
import { getCategory, getDetail, search } from '@/service/good'
import { getHome } from '@/service/home'
import {
  addAddress,
  deleteAddress,
  editAddress,
  getAddressDetail,
  getAddressList,
  getDefaultAddress,
} from '@/service/address'
import {
  cancelOrder,
  confirmOrder,
  createOrder,
  getOrderDetail,
  getOrderList,
  payOrder,
} from '@/service/order'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('service/user', () => {
  it('login 以 loginName/passwordMd5 请求 POST /user/login', async () => {
    await login({ loginName: 'newbee', passwordMd5: 'abc' })
    expect(request.post).toHaveBeenCalledWith('/user/login', {
      loginName: 'newbee',
      passwordMd5: 'abc',
    })
  })

  it('register 传明文 password（接口约定如此）', async () => {
    await register({ loginName: 'pax', password: '123456' })
    expect(request.post).toHaveBeenCalledWith('/user/register', {
      loginName: 'pax',
      password: '123456',
    })
  })

  it('getUserInfo 请求 GET /user/info', async () => {
    await getUserInfo()
    expect(request.get).toHaveBeenCalledWith('/user/info')
  })

  it('editUserInfo 请求 PUT /user/info', async () => {
    await editUserInfo({ nickName: 'n', introduceSign: 's' })
    expect(request.put).toHaveBeenCalledWith('/user/info', {
      nickName: 'n',
      introduceSign: 's',
    })
  })

  it('logout 请求 POST /user/logout', async () => {
    await logout()
    expect(request.post).toHaveBeenCalledWith('/user/logout')
  })
})

describe('service/cart', () => {
  it('getCart 请求 GET /shop-cart 并透传分页参数', async () => {
    await getCart({ pageNumber: 2 })
    expect(request.get).toHaveBeenCalledWith('/shop-cart', {
      params: { pageNumber: 2 },
    })
  })

  it('addCart 请求 POST /shop-cart', async () => {
    await addCart({ goodsId: 10001, goodsCount: 1 })
    expect(request.post).toHaveBeenCalledWith('/shop-cart', {
      goodsId: 10001,
      goodsCount: 1,
    })
  })

  it('modifyCart 请求 PUT /shop-cart', async () => {
    await modifyCart({ cartItemId: 7, goodsCount: 3 })
    expect(request.put).toHaveBeenCalledWith('/shop-cart', {
      cartItemId: 7,
      goodsCount: 3,
    })
  })

  it('deleteCartItem 把条目 id 拼进 URL', async () => {
    await deleteCartItem(7)
    expect(request.delete).toHaveBeenCalledWith('/shop-cart/7')
  })

  it('getByCartItemIds 以逗号分隔字符串作为 query 参数', async () => {
    await getByCartItemIds({ cartItemIds: '1,2,3' })
    expect(request.get).toHaveBeenCalledWith('/shop-cart/settle', {
      params: { cartItemIds: '1,2,3' },
    })
  })
})

describe('service/good 与 service/home', () => {
  it('getDetail 把商品 id 拼进 URL', async () => {
    await getDetail(10001)
    expect(request.get).toHaveBeenCalledWith('/goods/detail/10001')
  })

  it('search 透传关键字/分类/排序/页码', async () => {
    await search({
      pageNumber: 2,
      keyword: '耳机',
      goodsCategoryId: 3,
      orderBy: 'price',
    })
    expect(request.get).toHaveBeenCalledWith('/search', {
      params: {
        pageNumber: 2,
        keyword: '耳机',
        goodsCategoryId: 3,
        orderBy: 'price',
      },
    })
  })

  it('getCategory 请求 GET /categories', async () => {
    await getCategory()
    expect(request.get).toHaveBeenCalledWith('/categories')
  })

  it('getHome 请求 GET /index-infos', async () => {
    await getHome()
    expect(request.get).toHaveBeenCalledWith('/index-infos')
  })
})

describe('service/address', () => {
  it('getAddressList 以 axios params 传分页（回归：原实现误把参数当 axios 配置）', async () => {
    await getAddressList()
    expect(request.get).toHaveBeenCalledWith('/address', {
      params: { pageNumber: 1, pageSize: 1000 },
    })
  })

  it('addAddress 请求 POST /address', async () => {
    const params = {
      userName: '张三',
      userPhone: '13800138000',
      defaultFlag: 1 as const,
      provinceName: '北京市',
      cityName: '北京市',
      regionName: '朝阳区',
      detailAddress: '望京街道 1 号',
    }
    await addAddress(params)
    expect(request.post).toHaveBeenCalledWith('/address', params)
  })

  it('editAddress 请求 PUT /address 且带 addressId', async () => {
    await editAddress({
      addressId: 42,
      userName: '李四',
      userPhone: '13900139000',
      defaultFlag: 0,
      provinceName: '浙江省',
      cityName: '杭州市',
      regionName: '西湖区',
      detailAddress: '文三路 2 号',
    })
    expect(request.put).toHaveBeenCalledWith(
      '/address',
      expect.objectContaining({ addressId: 42 }),
    )
  })

  it('deleteAddress 与 getAddressDetail 把 id 拼进 URL', async () => {
    await deleteAddress(42)
    expect(request.delete).toHaveBeenCalledWith('/address/42')
    await getAddressDetail(42)
    expect(request.get).toHaveBeenCalledWith('/address/42')
  })

  it('getDefaultAddress 请求 GET /address/default', async () => {
    await getDefaultAddress()
    expect(request.get).toHaveBeenCalledWith('/address/default')
  })
})

describe('service/order', () => {
  it('createOrder 以 addressId 与 cartItemIds 数组请求 POST /saveOrder', async () => {
    await createOrder({ addressId: 42, cartItemIds: [1, 2] })
    expect(request.post).toHaveBeenCalledWith('/saveOrder', {
      addressId: 42,
      cartItemIds: [1, 2],
    })
  })

  it('getOrderList 透传状态与页码', async () => {
    await getOrderList({ pageNumber: 1, status: '0' })
    expect(request.get).toHaveBeenCalledWith('/order', {
      params: { pageNumber: 1, status: '0' },
    })
  })

  it('getOrderDetail 把订单号拼进 URL', async () => {
    await getOrderDetail('NB123')
    expect(request.get).toHaveBeenCalledWith('/order/NB123')
  })

  it('cancelOrder 与 confirmOrder 分别请求 /cancel 与 /finish', async () => {
    await cancelOrder('NB123')
    expect(request.put).toHaveBeenCalledWith('/order/NB123/cancel')
    await confirmOrder('NB123')
    expect(request.put).toHaveBeenCalledWith('/order/NB123/finish')
  })

  it('payOrder 以 GET /paySuccess 携带订单号与支付方式', async () => {
    await payOrder({ orderNo: 'NB123', payType: 1 })
    expect(request.get).toHaveBeenCalledWith('/paySuccess', {
      params: { orderNo: 'NB123', payType: 1 },
    })
  })
})
