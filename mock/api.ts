// dev 环境最小可用 Mock 后端，覆盖：用户 / 首页 / 分类 / 搜索 / 商品详情 / 购物车。
// 响应结构与 newbee-mall 线上接口一致：{ resultCode, message, data }；
// 无凭证访问需登录的接口返回 resultCode 416，用于驱动前端拦截器踢回登录页。
// 用户、登录态与购物车持久化在 mock/.data.json（已 gitignore），重启 dev server 不丢失。
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { md5 } from 'js-md5'

interface MockUser {
  passwordMd5: string
  nickName: string
  introduceSign: string
}

// 预置演示账号：newbee / 123456
const users = new Map<string, MockUser>([
  [
    'newbee',
    {
      passwordMd5: md5('123456'),
      nickName: '新蜂会员',
      introduceSign: '随新蜂，识本心',
    },
  ],
])

/** token -> loginName */
const tokens = new Map<string, string>()

interface MockCartItem {
  cartItemId: number
  goodsId: number
  goodsName: string
  goodsCoverImg: string
  sellingPrice: number
  goodsCount: number
}

/** loginName -> 购物车条目列表 */
const carts = new Map<string, MockCartItem[]>()

interface MockAddress {
  addressId: number
  userName: string
  userPhone: string
  defaultFlag: 0 | 1
  provinceName: string
  cityName: string
  regionName: string
  detailAddress: string
}

/** loginName -> 收货地址列表 */
const addresses = new Map<string, MockAddress[]>()

interface MockOrder {
  orderId: number
  orderNo: string
  totalPrice: number
  /** 1-微信 2-支付宝，未支付时无该字段 */
  payType?: number
  orderStatus: number
  orderStatusString: string
  createTime: string
  newBeeMallOrderItemVOS: MockCartItem[]
}

/** loginName -> 订单列表（新单在前） */
const orders = new Map<string, MockOrder[]>()

const ORDER_STATUS_TEXT: Record<number, string> = {
  '-3': '商家关闭',
  '-2': '超时关闭',
  '-1': '手动关闭',
  0: '待支付',
  1: '已支付',
  2: '配货完成',
  3: '出库成功',
  4: '交易成功',
}

// ---- 持久化：configureServer 时确定文件路径并加载，数据变更后即时写回 ----
let dataFile = ''

const loadData = () => {
  if (!existsSync(dataFile)) return
  try {
    const raw = JSON.parse(readFileSync(dataFile, 'utf-8')) as {
      users?: Record<string, MockUser>
      tokens?: Record<string, string>
      carts?: Record<string, MockCartItem[]>
      addresses?: Record<string, MockAddress[]>
      orders?: Record<string, MockOrder[]>
    }
    for (const [name, user] of Object.entries(raw.users ?? {})) {
      users.set(name, user)
    }
    for (const [token, name] of Object.entries(raw.tokens ?? {})) {
      tokens.set(token, name)
    }
    for (const [name, items] of Object.entries(raw.carts ?? {})) {
      carts.set(name, items)
    }
    for (const [name, items] of Object.entries(raw.addresses ?? {})) {
      addresses.set(name, items)
    }
    for (const [name, items] of Object.entries(raw.orders ?? {})) {
      orders.set(name, items)
    }
  } catch {
    // 数据文件损坏时忽略，按预置数据启动
  }
}

const saveData = () => {
  if (!dataFile) return
  writeFileSync(
    dataFile,
    JSON.stringify(
      {
        users: Object.fromEntries(users),
        tokens: Object.fromEntries(tokens),
        carts: Object.fromEntries(carts),
        addresses: Object.fromEntries(addresses),
        orders: Object.fromEntries(orders),
      },
      null,
      2,
    ),
  )
}

/** 生成纯色底 + 文字的 SVG data-URI 占位图，替代已停服的原 CDN 商品图 */
const svgCover = (label: string, bg: string, width = 300, height = 300) => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="50%" fill="#fff" font-size="${Math.round(height / 8)}" ` +
    `font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// ---- 分类树（结构对齐 CategoryLevel1[]），id 全局自增 ----
let categorySeq = 1
const cat = (categoryName: string) => ({
  categoryId: categorySeq++,
  categoryName,
})
const catTree = (name: string, children: Record<string, string[]>) =>
  Object.assign(cat(name), {
    secondLevelCategoryVOS: Object.entries(children).map(([l2, l3List]) =>
      Object.assign(cat(l2), { thirdLevelCategoryVOS: l3List.map(cat) }),
    ),
  })

const categories = [
  catTree('新蜂超市', {
    食品饮料: ['进口零食', '进口牛奶', '饼干蛋糕', '糖果巧克力'],
    粮油调味: ['食用油', '大米', '面粉', '调味品'],
    饮料冲调: ['饮用水', '茶饮料', '咖啡', '蜂蜜'],
  }),
  catTree('新蜂服饰', {
    女装: ['连衣裙', '半身裙', 'T恤', '衬衫'],
    男装: ['夹克', '牛仔裤', '卫衣', 'POLO衫'],
    内衣配饰: ['袜子', '围巾', '帽子', '腰带'],
  }),
  catTree('新蜂数码', {
    手机通讯: ['智能手机', '老人机', '对讲机'],
    电脑办公: ['笔记本', '平板电脑', '键盘鼠标', '显示器'],
    影音娱乐: ['耳机', '音箱', '麦克风'],
  }),
  catTree('新蜂生鲜', {
    新鲜水果: ['苹果', '香蕉', '橙子', '车厘子'],
    时令蔬菜: ['叶菜类', '根茎类', '菌菇类'],
    肉禽蛋品: ['猪肉', '牛肉', '鸡蛋'],
  }),
  catTree('新蜂家居', {
    床上用品: ['四件套', '被子', '枕头'],
    厨房用具: ['炒锅', '刀具', '碗碟餐具'],
    清洁收纳: ['洗衣液', '纸品', '收纳箱'],
  }),
]

// ---- 商品池：/search、商品详情、首页栏目共用同一份数据 ----
interface MockGoods {
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

const allLevel3Ids = categories.flatMap((l1) =>
  l1.secondLevelCategoryVOS.flatMap((l2) =>
    l2.thirdLevelCategoryVOS.map((l3) => l3.categoryId),
  ),
)

const goodsPool: MockGoods[] = []
let goodsSeq = 10001

const makeGoods = (name: string, sellingPrice: number, bg: string) => {
  const goodsId = goodsSeq++
  const goods: MockGoods = {
    goodsId,
    goodsName: name,
    goodsIntro: `${name} · 新蜂精选`,
    sellingPrice,
    originalPrice: Math.round(sellingPrice * 1.3),
    // 按序循环挂到三级分类上，保证分类页点进前面的分类基本有货
    goodsCategoryId: allLevel3Ids[(goodsId - 10001) % allLevel3Ids.length],
    goodsCoverImg: svgCover(name, bg),
    tag: '',
    goodsSellStatus: 0,
    stockNum: 100,
  }
  goodsPool.push(goods)
  return goods
}

/** 首页数据（结构对齐 HomeData），轮播点击跳对应商品详情 */
const homeData = {
  carousels: [
    {
      carouselUrl: svgCover('新蜂商城 · 夏日特惠', '#1baeae', 750, 300),
      redirectUrl: '#/product/10001',
    },
    {
      carouselUrl: svgCover('数码新品季', '#5a7dff', 750, 300),
      redirectUrl: '#/product/10005',
    },
    {
      carouselUrl: svgCover('生鲜次日达', '#ff9c6e', 750, 300),
      redirectUrl: '#/product/10009',
    },
  ],
  newGoodses: [
    makeGoods('无线降噪耳机', 399, '#8a67c2'),
    makeGoods('便携咖啡杯', 89, '#c2855a'),
    makeGoods('氮化镓充电器', 129, '#4a90d9'),
    makeGoods('印花帆布包', 59, '#e0719c'),
  ],
  hotGoodses: [
    makeGoods('机械键盘', 299, '#455a74'),
    makeGoods('保温焖烧壶', 149, '#d9534f'),
    makeGoods('云朵抱枕', 49, '#7fb8a4'),
    makeGoods('智能手环', 199, '#333c4e'),
  ],
  recommendGoodses: [
    makeGoods('复古蓝牙音箱', 259, '#b0713f'),
    makeGoods('陶瓷马克杯', 39, '#6d9e8f'),
    makeGoods('折叠电脑支架', 99, '#5e6ad2'),
    makeGoods('香薰加湿器', 119, '#a86fb5'),
    makeGoods('速干运动毛巾', 29, '#4aa3a0'),
    makeGoods('露营折叠椅', 179, '#7a8c4f'),
  ],
}

// 补充列表商品，凑足多页数据便于体验 van-list 无限滚动（pageSize 为 10）
const extraGoodsSeed: Array<[string, number, string]> = [
  ['天然乳胶枕', 169, '#8f7a66'],
  ['迷你破壁机', 329, '#4a6fa5'],
  ['户外速开帐篷', 459, '#5d7d4b'],
  ['无线充电底座', 79, '#6c5ce7'],
  ['全棉四件套', 289, '#b56576'],
  ['智能体脂秤', 99, '#00a8a8'],
  ['降噪头戴耳机', 899, '#2f3640'],
  ['手冲咖啡壶', 139, '#a0785a'],
  ['儿童安全座椅', 1299, '#3d6b99'],
  ['电动牙刷', 199, '#48929b'],
  ['羽绒轻薄被', 399, '#8d6cab'],
  ['不粘炒锅', 159, '#c0392b'],
  ['多功能料理锅', 549, '#d35400'],
  ['桌面加湿器', 69, '#74a9d8'],
  ['瑜伽垫', 89, '#69a297'],
  ['行李箱 20 寸', 349, '#535c68'],
]
for (const [name, price, bg] of extraGoodsSeed) {
  makeGoods(name, price, bg)
}

const ok = <T>(data: T) => ({ resultCode: 200, message: 'SUCCESS', data })
const fail = (resultCode: number, message: string) => ({
  resultCode,
  message,
  data: null,
})

const send = (res: ServerResponse, body: unknown) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// 不用 Buffer 全局：tsconfig 的 types 仅含 vite/client，未引入 node 全局类型
const readBody = async <T = Record<string, string>>(
  req: IncomingMessage,
): Promise<T> => {
  const decoder = new TextDecoder()
  let raw = ''
  for await (const chunk of req) {
    raw += decoder.decode(chunk as Uint8Array, { stream: true })
  }
  raw += decoder.decode()
  try {
    return JSON.parse(raw || '{}') as T
  } catch {
    return {} as T
  }
}

/** 从 token 请求头解析当前登录用户，未登录返回 undefined */
const authUser = (req: IncomingMessage) =>
  tokens.get(String(req.headers['token'] ?? ''))

const handle = async (req: IncomingMessage, res: ServerResponse) => {
  // use('/api/v1') 挂载后，这里的 req.url 已被 connect 去掉该前缀
  const [path, queryString = ''] = (req.url ?? '').split('?')
  const route = `${req.method} ${path}`
  const query = new URLSearchParams(queryString)

  try {
    // 首页数据为公开接口，无需登录态
    if (route === 'GET /index-infos') {
      return send(res, ok(homeData))
    }

    // 分类树，公开接口
    if (route === 'GET /categories') {
      return send(res, ok(categories))
    }

    // 商品搜索（公开）：keyword 匹配名称、goodsCategoryId 过滤、orderBy 排序、pageNumber 分页
    if (route === 'GET /search') {
      const keyword = (query.get('keyword') ?? '').trim().toLowerCase()
      const categoryId = Number(query.get('goodsCategoryId') || 0)
      const orderBy = query.get('orderBy') ?? ''
      const pageNumber = Math.max(1, Number(query.get('pageNumber') || 1))
      const pageSize = 10

      const list = goodsPool.filter(
        (goods) =>
          (!keyword || goods.goodsName.toLowerCase().includes(keyword)) &&
          (!categoryId || goods.goodsCategoryId === categoryId),
      )
      const comparators: Record<
        string,
        (a: MockGoods, b: MockGoods) => number
      > = {
        new: (a, b) => b.goodsId - a.goodsId,
        price: (a, b) => a.sellingPrice - b.sellingPrice,
      }
      if (comparators[orderBy]) {
        // filter 的结果是新数组，原地排序不影响商品池；
        // toSorted 需要 ES2023 lib，为 Mock 抬升项目 lib 不值得
        // oxlint-disable-next-line unicorn/no-array-sort
        list.sort(comparators[orderBy])
      }

      const totalCount = list.length
      return send(
        res,
        ok({
          list: list.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          totalCount,
          totalPage: Math.ceil(totalCount / pageSize),
          currPage: pageNumber,
          pageSize,
        }),
      )
    }

    // 商品详情（公开）：轮播图与富文本详情按需组装
    const detailMatch = path.match(/^\/goods\/detail\/(\d+)$/)
    if (req.method === 'GET' && detailMatch) {
      const goods = goodsPool.find(
        (item) => item.goodsId === Number(detailMatch[1]),
      )
      if (!goods) {
        return send(res, fail(404, '商品不存在'))
      }
      const detailHtml =
        `<p style="padding:12px 15px;font-size:14px;color:#555;line-height:1.8;">` +
        `${goods.goodsIntro}。甄选优质原料，工艺考究，品质保障，支持七天无理由退换。</p>` +
        `<img style="display:block;width:100%;" src="${svgCover(`${goods.goodsName} · 详情 1`, '#9aa5b1', 750, 500)}" />` +
        `<img style="display:block;width:100%;" src="${svgCover(`${goods.goodsName} · 详情 2`, '#7b8794', 750, 500)}" />`
      return send(
        res,
        ok({
          ...goods,
          goodsCarouselList: [
            goods.goodsCoverImg,
            svgCover(`${goods.goodsName} · 细节`, '#6b7a8f', 750, 750),
            svgCover(`${goods.goodsName} · 场景`, '#8f6b7a', 750, 750),
          ],
          goodsDetailContent: detailHtml,
        }),
      )
    }

    if (route === 'POST /user/login') {
      const { loginName = '', passwordMd5 = '' } = await readBody(req)
      const user = users.get(loginName)
      if (!user || user.passwordMd5 !== passwordMd5) {
        return send(res, fail(500, '登录失败：用户名或密码错误'))
      }
      const token = randomUUID().replace(/-/g, '')
      tokens.set(token, loginName)
      saveData()
      return send(res, ok(token))
    }

    if (route === 'POST /user/register') {
      const { loginName = '', password = '' } = await readBody(req)
      if (!loginName || !password) {
        return send(res, fail(500, '用户名或密码不能为空'))
      }
      if (users.has(loginName)) {
        return send(res, fail(500, '用户名已存在！'))
      }
      users.set(loginName, {
        passwordMd5: md5(password),
        nickName: loginName,
        introduceSign: '随新蜂，识本心',
      })
      saveData()
      return send(res, ok(null))
    }

    if (route === 'GET /user/info') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const user = users.get(loginName)!
      return send(
        res,
        ok({
          loginName,
          nickName: user.nickName,
          introduceSign: user.introduceSign,
        }),
      )
    }

    if (route === 'POST /user/logout') {
      tokens.delete(String(req.headers['token'] ?? ''))
      saveData()
      return send(res, ok(null))
    }

    // 修改用户信息：昵称/签名必传，密码留空则不修改
    if (route === 'PUT /user/info') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<{
        nickName?: string
        introduceSign?: string
        passwordMd5?: string
      }>(req)
      const user = users.get(loginName)!
      if (body.nickName !== undefined) user.nickName = body.nickName
      if (body.introduceSign !== undefined) {
        user.introduceSign = body.introduceSign
      }
      if (body.passwordMd5) user.passwordMd5 = body.passwordMd5
      saveData()
      return send(res, ok(null))
    }

    // 购物车查询（NavBar 徽标、购物车页使用）
    if (route === 'GET /shop-cart') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      return send(res, ok(carts.get(loginName) ?? []))
    }

    // 修改购物车条目数量
    if (route === 'PUT /shop-cart') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<{ cartItemId?: number; goodsCount?: number }>(
        req,
      )
      const item = (carts.get(loginName) ?? []).find(
        (cartItem) => cartItem.cartItemId === body.cartItemId,
      )
      if (!item) {
        return send(res, fail(404, '购物车条目不存在'))
      }
      const goodsCount = body.goodsCount ?? 1
      if (goodsCount > 5) {
        return send(res, fail(500, '超出单个商品的最大购买数量！'))
      }
      item.goodsCount = Math.max(1, goodsCount)
      saveData()
      return send(res, ok(null))
    }

    // 删除购物车条目
    const cartDeleteMatch = path.match(/^\/shop-cart\/(\d+)$/)
    if (req.method === 'DELETE' && cartDeleteMatch) {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const cartItemId = Number(cartDeleteMatch[1])
      carts.set(
        loginName,
        (carts.get(loginName) ?? []).filter(
          (cartItem) => cartItem.cartItemId !== cartItemId,
        ),
      )
      saveData()
      return send(res, ok(null))
    }

    // 加入购物车：同商品累加数量（单品上限 5，对齐原接口约束）
    if (route === 'POST /shop-cart') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<{ goodsId?: number; goodsCount?: number }>(
        req,
      )
      const goods = goodsPool.find((item) => item.goodsId === body.goodsId)
      if (!goods) {
        return send(res, fail(404, '商品不存在'))
      }
      const items = carts.get(loginName) ?? []
      const existed = items.find((item) => item.goodsId === goods.goodsId)
      if (existed) {
        if (existed.goodsCount >= 5) {
          return send(res, fail(500, '超出单个商品的最大购买数量！'))
        }
        existed.goodsCount += body.goodsCount ?? 1
      } else {
        items.push({
          cartItemId: Date.now(),
          goodsId: goods.goodsId,
          goodsName: goods.goodsName,
          goodsCoverImg: goods.goodsCoverImg,
          sellingPrice: goods.sellingPrice,
          goodsCount: body.goodsCount ?? 1,
        })
      }
      carts.set(loginName, items)
      saveData()
      return send(res, ok(null))
    }

    // 结算商品查询：按逗号分隔的 cartItemIds 从购物车取条目（确认订单页回显用）
    if (route === 'GET /shop-cart/settle') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const ids = new Set(
        (query.get('cartItemIds') ?? '').split(',').map(Number),
      )
      const items = (carts.get(loginName) ?? []).filter((item) =>
        ids.has(item.cartItemId),
      )
      return send(res, ok(items))
    }

    // 创建订单：勾选的购物车条目转为订单（待支付），并从购物车移除
    if (route === 'POST /saveOrder') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<{
        addressId?: number
        cartItemIds?: number[]
      }>(req)
      const ids = new Set(body.cartItemIds ?? [])
      const hasAddress = (addresses.get(loginName) ?? []).some(
        (address) => address.addressId === body.addressId,
      )
      if (!hasAddress) {
        return send(res, fail(500, '收货地址不存在'))
      }
      const cartItems = carts.get(loginName) ?? []
      const orderItems = cartItems.filter((item) => ids.has(item.cartItemId))
      if (!orderItems.length) {
        return send(res, fail(500, '购物车条目不存在'))
      }
      const orderNo = `NB${Date.now()}`
      const list = orders.get(loginName) ?? []
      list.unshift({
        orderId: Date.now(),
        orderNo,
        totalPrice: orderItems.reduce(
          (sum, item) => sum + item.sellingPrice * item.goodsCount,
          0,
        ),
        orderStatus: 0,
        orderStatusString: ORDER_STATUS_TEXT[0],
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        newBeeMallOrderItemVOS: orderItems,
      })
      orders.set(loginName, list)
      carts.set(
        loginName,
        cartItems.filter((item) => !ids.has(item.cartItemId)),
      )
      saveData()
      return send(res, ok(orderNo))
    }

    // 支付：待支付订单直接置为"出库成功（已发货）"并记录支付方式。
    // 真实后台的已支付→配货→出库由运营推进，Mock 无人推进，
    // 跳过中间态以便前端能体验"确认收货"流程
    if (route === 'GET /paySuccess') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const order = (orders.get(loginName) ?? []).find(
        (item) => item.orderNo === query.get('orderNo'),
      )
      if (!order) {
        return send(res, fail(404, '订单不存在'))
      }
      if (order.orderStatus !== 0) {
        return send(res, fail(500, '订单状态异常，无法支付'))
      }
      order.orderStatus = 3
      order.orderStatusString = ORDER_STATUS_TEXT[3]
      order.payType = Number(query.get('payType') || 0)
      saveData()
      return send(res, ok(null))
    }

    // 订单列表：按状态筛选（空串为全部）+ 分页
    if (route === 'GET /order') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const status = query.get('status') ?? ''
      const pageNumber = Math.max(1, Number(query.get('pageNumber') || 1))
      const pageSize = 5
      const all = orders.get(loginName) ?? []
      const list =
        status === ''
          ? all
          : all.filter((order) => order.orderStatus === Number(status))
      const totalCount = list.length
      return send(
        res,
        ok({
          list: list.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
          totalCount,
          totalPage: Math.ceil(totalCount / pageSize),
          currPage: pageNumber,
          pageSize,
        }),
      )
    }

    // 取消订单：仅待支付可取消，置为手动关闭
    const orderCancelMatch = path.match(/^\/order\/(\w+)\/cancel$/)
    if (req.method === 'PUT' && orderCancelMatch) {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const order = (orders.get(loginName) ?? []).find(
        (item) => item.orderNo === orderCancelMatch[1],
      )
      if (!order) {
        return send(res, fail(404, '订单不存在'))
      }
      if (order.orderStatus !== 0) {
        return send(res, fail(500, '当前状态不可取消'))
      }
      order.orderStatus = -1
      order.orderStatusString = ORDER_STATUS_TEXT[-1]
      saveData()
      return send(res, ok(null))
    }

    // 确认收货：仅已发货（出库成功）可确认，置为交易成功
    const orderFinishMatch = path.match(/^\/order\/(\w+)\/finish$/)
    if (req.method === 'PUT' && orderFinishMatch) {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const order = (orders.get(loginName) ?? []).find(
        (item) => item.orderNo === orderFinishMatch[1],
      )
      if (!order) {
        return send(res, fail(404, '订单不存在'))
      }
      if (order.orderStatus !== 3) {
        return send(res, fail(500, '当前状态不可确认收货'))
      }
      order.orderStatus = 4
      order.orderStatusString = ORDER_STATUS_TEXT[4]
      saveData()
      return send(res, ok(null))
    }

    // 订单详情
    const orderDetailMatch = path.match(/^\/order\/(\w+)$/)
    if (req.method === 'GET' && orderDetailMatch) {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const order = (orders.get(loginName) ?? []).find(
        (item) => item.orderNo === orderDetailMatch[1],
      )
      if (!order) {
        return send(res, fail(404, '订单不存在'))
      }
      return send(res, ok(order))
    }

    // 收货地址列表（忽略分页参数，一次性返回全部）
    if (route === 'GET /address') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      return send(res, ok(addresses.get(loginName) ?? []))
    }

    // 默认收货地址，未设置时 data 为 null（下单页使用）
    if (route === 'GET /address/default') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const item = (addresses.get(loginName) ?? []).find(
        (address) => address.defaultFlag === 1,
      )
      return send(res, ok(item ?? null))
    }

    // 新增收货地址；设为默认时互斥清除其他默认标记
    if (route === 'POST /address') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<Partial<MockAddress>>(req)
      const list = addresses.get(loginName) ?? []
      if (body.defaultFlag === 1) {
        for (const address of list) address.defaultFlag = 0
      }
      list.push({
        addressId: Date.now(),
        userName: body.userName ?? '',
        userPhone: body.userPhone ?? '',
        defaultFlag: body.defaultFlag === 1 ? 1 : 0,
        provinceName: body.provinceName ?? '',
        cityName: body.cityName ?? '',
        regionName: body.regionName ?? '',
        detailAddress: body.detailAddress ?? '',
      })
      addresses.set(loginName, list)
      saveData()
      return send(res, ok(null))
    }

    // 编辑收货地址
    if (route === 'PUT /address') {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const body = await readBody<Partial<MockAddress>>(req)
      const list = addresses.get(loginName) ?? []
      const item = list.find((address) => address.addressId === body.addressId)
      if (!item) {
        return send(res, fail(404, '地址不存在'))
      }
      if (body.defaultFlag === 1) {
        for (const address of list) address.defaultFlag = 0
      }
      Object.assign(item, body)
      saveData()
      return send(res, ok(null))
    }

    // 地址详情 / 删除地址
    const addressMatch = path.match(/^\/address\/(\d+)$/)
    if (addressMatch) {
      const loginName = authUser(req)
      if (!loginName) {
        return send(res, fail(416, '未登录！'))
      }
      const addressId = Number(addressMatch[1])
      const list = addresses.get(loginName) ?? []
      if (req.method === 'GET') {
        const item = list.find((address) => address.addressId === addressId)
        if (!item) {
          return send(res, fail(404, '地址不存在'))
        }
        return send(res, ok(item))
      }
      if (req.method === 'DELETE') {
        addresses.set(
          loginName,
          list.filter((address) => address.addressId !== addressId),
        )
        saveData()
        return send(res, ok(null))
      }
    }

    // 兜底：未实现的接口返回明确的 JSON 错误，
    // 避免落到 vite 的 HTML fallback 触发前端"服务端异常"提示
    return send(res, fail(404, `Mock 未实现：${route}`))
  } catch {
    // Mock 内部兜底，避免 rejection 逃逸到 connect 造成崩溃
    if (!res.writableEnded) {
      send(res, fail(500, 'Mock 内部错误'))
    }
  }
}

// handle 内部已 try/catch 兜底、不会 reject，
// 注册同步函数以规避 connect 不处理 async rejection 的问题
const setup = (
  root: string,
  middlewares: {
    use: (
      path: string,
      fn: (req: IncomingMessage, res: ServerResponse) => void,
    ) => void
  },
) => {
  dataFile = join(root, 'mock/.data.json')
  loadData()
  middlewares.use('/api/v1', (req, res) => {
    void handle(req, res)
  })
}

export function mockApi(): Plugin {
  return {
    name: 'mock-api',
    // dev 与 preview 都挂载，preview 下也能走通全部接口流程
    configureServer(server) {
      setup(server.config.root, server.middlewares)
    },
    configurePreviewServer(server) {
      setup(server.config.root, server.middlewares)
    },
  }
}
