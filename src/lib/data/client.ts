import { z } from 'zod'
import { withBasePath } from '@/lib/version'

/** 数据读取失败时抛出，页面据此区分「网络问题」和「数据格式不对」。 */
export class DatasetError extends Error {
  readonly status?: number
  readonly url: string

  constructor(message: string, options: { url: string; status?: number; cause?: unknown }) {
    super(message, { cause: options.cause })
    this.name = 'DatasetError'
    this.url = options.url
    this.status = options.status
  }
}

/**
 * 统一的数据入口：请求 → 校验 → 返回强类型结果。
 *
 * 目前所有数据集都是 `public/data/*.json` 里的静态文件，`fetch` 走的是同源
 * 静态资源；换成真实接口时这个函数一行都不用改，只改 `endpoints.ts`。
 */
export async function requestDataset<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const url = withBasePath(path)
  let response: Response

  try {
    response = await fetch(url, {
      ...init,
      headers: { accept: 'application/json', ...init?.headers },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new DatasetError('网络不可用，无法读取数据', { url, cause: error })
  }

  if (!response.ok) {
    throw new DatasetError(`读取数据失败（HTTP ${response.status}）`, {
      url,
      status: response.status,
    })
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch (error) {
    throw new DatasetError('返回内容不是合法 JSON', { url, cause: error })
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw new DatasetError(`数据格式与 schema 不匹配：${z.prettifyError(parsed.error)}`, { url })
  }

  return parsed.data
}
