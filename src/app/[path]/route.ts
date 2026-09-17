import { createSerwistRoute } from '@serwist/turbopack'
import { appConfig } from '@app-config'

/**
 * Turbopack 目前还没有 webpack 那样的插件钩子，所以 Serwist 改为用一个
 * 静态路由在「构建期」把 Service Worker 打出来：
 *
 *   pnpm build  →  generateStaticParams 枚举出 sw.js / sw.js.map
 *                →  esbuild 打包 src/sw.ts，并把预缓存清单注入 __SW_MANIFEST
 *                →  产出 /sw.js（静态文件，运行时零开销）
 *
 * **这个文件必须放在 `src/app/` 根目录。** Service Worker 的默认最大作用域是脚本
 * 所在目录，而站点部署在 basePath 子目录下（`/web-pwa-next-starter/`），页面全在这个
 * 前缀里。只有把脚本输出到 basePath 根目录，注册时请求的 scope 才不会超出上限。
 *
 * 之前它放在 `app/serwist/[path]/`，脚本 URL 是 `/web-pwa-next-starter/serwist/sw.js`，
 * 最大作用域只有 `/web-pwa-next-starter/serwist/`，注册直接失败：
 *   SecurityError: The path of the provided scope ('/web-pwa-next-starter/')
 *   is not under the max scope allowed ('/web-pwa-next-starter/serwist/')
 * `createSerwistRoute` 本来会在响应头里补 `Service-Worker-Allowed: /`，但 `output: 'export'`
 * 只导出响应体，响应头会被丢掉（静态导出也不支持 headers()），靠响应头救不了，
 * 所以只能把脚本挪到根目录。改动前后 `src/lib/pwa.ts` 里的 serviceWorkerPath 要一起改。
 */
const offlineUrl = `${appConfig.basePath}/offline`

const serwistRoute = createSerwistRoute({
  /** Service Worker 源码入口。 */
  swSrc: 'src/sw.ts',
  /** 预缓存清单的注入点，与 src/sw.ts 里的 global 声明一致。 */
  injectionPoint: 'self.__SW_MANIFEST',
  /**
   * 默认只预缓存 `.next/static/**` 和 `public/**`，App Router 预渲染出来的
   * HTML 不在其中，离线兜底页必须显式加进来。
   * revision 用构建时间，保证每次发版都会重新拉取离线页。
   */
  additionalPrecacheEntries: [
    { url: offlineUrl, revision: process.env.NEXT_PUBLIC_BUILD_TIME ?? 'v1' },
  ],
  esbuildOptions: {
    define: {
      // Service Worker 运行在浏览器里，没有 process：在打包期就把
      // NODE_ENV 定死，否则 serwist 的 defaultCache 会退化成 NetworkOnly。
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      __APP_BASE_PATH__: JSON.stringify(appConfig.basePath),
    },
  },
})

export const { dynamic, dynamicParams, revalidate, generateStaticParams } = serwistRoute

/**
 * 包一层 GET，只为补上 Cache-Control。
 *
 * 这是给 `pnpm start` 这类真实服务器用的：静态部署时响应头由 CDN 决定
 * （见 scripts/youpai-sync.mjs）。Next 默认会给静态路由加 `s-maxage=31536000`，
 * CDN 边缘可能把 sw.js 缓存一年，新版本 Service Worker 迟迟不生效。
 * 浏览器对主 SW 脚本本来就不走 HTTP 缓存，但不该把风险留给边缘节点。
 */
export async function GET(request: Request, context: { params: Promise<{ path: string }> }) {
  const response = await serwistRoute.GET(request, context)
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  return response
}
