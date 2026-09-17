/**
 * 构建期通过 `next.config.ts` 的 `env` 注入，运行期可直接读取。
 * 这些值会被内联进客户端 bundle，因此不要往里塞任何密钥。
 */
export const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

export const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME ?? ''

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** 把以 `/` 开头的应用内绝对路径补上部署前缀。 */
export function withBasePath(path: string) {
  if (!basePath) return path
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`
}

/** `2026-03-01T08:00:00.000Z` → `2026-03-01 16:00`（本地时区）。 */
export function formatBuildTime(value: string = buildTime) {
  if (!value) return '未知'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
