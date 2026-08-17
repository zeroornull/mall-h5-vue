// newbee-mall 接口数据模型。
// 字段与原项目本地 Mock（mock/mock-server.js）及新蜂商城线上接口保持一致。

/** 分页结果包装 */
export interface PageResult<T> {
  list: T[]
  totalCount: number
  totalPage: number
  currPage: number
  pageSize: number
}

/** 商品 */
export interface Goods {
  goodsId: number
  goodsName: string
  goodsIntro: string
  sellingPrice: number
  originalPrice: number
  goodsCategoryId: number
  goodsCoverImg: string
  tag: string
  goodsSellStatus: number
  stockNum: number
}

/** 商品详情（含轮播图与富文本详情） */
export interface GoodsDetail extends Goods {
  goodsCarouselList: string[]
  goodsDetailContent: string
}

/** 首页轮播图 */
export interface Carousel {
  carouselUrl: string
  redirectUrl: string
}

/** 首页数据 */
export interface HomeData {
  carousels: Carousel[]
  newGoodses: Goods[]
  hotGoodses: Goods[]
  recommendGoodses: Goods[]
}

/** 三级分类 */
export interface CategoryLevel3 {
  categoryId: number
  categoryName: string
}

/** 二级分类 */
export interface CategoryLevel2 extends CategoryLevel3 {
  thirdLevelCategoryVOS: CategoryLevel3[]
}

/** 一级分类 */
export interface CategoryLevel1 extends CategoryLevel3 {
  secondLevelCategoryVOS: CategoryLevel2[]
}

/** 购物车条目（订单内商品条目结构与其一致） */
export interface CartItem {
  cartItemId: number
  goodsId: number
  goodsName: string
  goodsCoverImg: string
  sellingPrice: number
  goodsCount: number
}

/** 收货地址 */
export interface Address {
  addressId: number
  userName: string
  userPhone: string
  /** 1-默认地址 0-非默认 */
  defaultFlag: 0 | 1
  provinceName: string
  cityName: string
  regionName: string
  detailAddress: string
}

/**
 * 订单状态：
 * -3 商家关闭 / -2 超时关闭 / -1 手动关闭 /
 * 0 待支付 / 1 已支付 / 2 配货完成 / 3 出库成功 / 4 交易成功
 */
export interface Order {
  orderId: number
  orderNo: string
  totalPrice: number
  /** 支付方式：1-微信 2-支付宝，未支付时无该字段 */
  payType?: number
  orderStatus: number
  orderStatusString: string
  createTime: string
  newBeeMallOrderItemVOS: CartItem[]
}

/** 用户信息 */
export interface UserInfo {
  loginName: string
  nickName: string
  introduceSign: string
}
