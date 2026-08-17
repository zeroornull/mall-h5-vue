// dev 环境最小可用 Mock 后端（当前仅覆盖用户相关接口）。
// 响应结构与 newbee-mall 线上接口一致：{ resultCode, message, data }；
// 无凭证访问需登录的接口返回 resultCode 416，用于驱动前端拦截器踢回登录页。
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
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

/** token -> loginName，仅存内存，重启 dev server 即失效 */
const tokens = new Map<string, string>()

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
const readBody = async (
  req: IncomingMessage,
): Promise<Record<string, string>> => {
  const decoder = new TextDecoder()
  let raw = ''
  for await (const chunk of req) {
    raw += decoder.decode(chunk as Uint8Array, { stream: true })
  }
  raw += decoder.decode()
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

const handle = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => {
  // use('/api/v1') 挂载后，这里的 req.url 已被 connect 去掉该前缀
  const path = (req.url ?? '').split('?')[0]
  const route = `${req.method} ${path}`

  try {
    if (route === 'POST /user/login') {
      const { loginName = '', passwordMd5 = '' } = await readBody(req)
      const user = users.get(loginName)
      if (!user || user.passwordMd5 !== passwordMd5) {
        return send(res, fail(500, '登录失败：用户名或密码错误'))
      }
      const token = randomUUID().replace(/-/g, '')
      tokens.set(token, loginName)
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
      return send(res, ok(null))
    }

    if (route === 'GET /user/info') {
      const loginName = tokens.get(String(req.headers['token'] ?? ''))
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
      return send(res, ok(null))
    }

    next()
  } catch {
    // Mock 内部兜底，避免 rejection 逃逸到 connect 造成崩溃
    if (!res.writableEnded) {
      send(res, fail(500, 'Mock 内部错误'))
    }
  }
}

export function mockApi(): Plugin {
  return {
    name: 'mock-api',
    apply: 'serve',
    configureServer(server) {
      // handle 内部已 try/catch 兜底、不会 reject，
      // 注册同步函数以规避 connect 不处理 async rejection 的问题
      server.middlewares.use('/api/v1', (req, res, next) => {
        void handle(req, res, next)
      })
    },
  }
}
