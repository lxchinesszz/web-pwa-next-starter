/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker'
import { Serwist, type PrecacheEntry, type SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    /** 由 esbuild 在构建期注入的预缓存清单，见 src/app/serwist/[path]/route.ts。 */
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

/**
 * 这两个值由 route.ts 的 `esbuildOptions.define` 在打包时替换成字面量。
 * Service Worker 里没有 `process`，所以绝不能在这里读 process.env。
 */
declare const __APP_BASE_PATH__: string

declare const self: ServiceWorkerGlobalScope

const offlineUrl = `${__APP_BASE_PATH__}/offline`

const serwist = new Serwist({
  // 预缓存清单：`.next/static/**` 与 `public/**` 下的静态资源，
  // 外加 route.ts 里显式追加的离线兜底页。
  precacheEntries: self.__SW_MANIFEST,
  // 新版本先进入 waiting 状态，等页面上的「立即更新」按钮显式触发，
  // 避免用户正在填表单时被强制刷新。
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: offlineUrl,
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()
