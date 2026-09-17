import { withBasePath } from './version'

/**
 * PWA 相关的公开路径。
 *
 * Service Worker 由 `src/app/[path]/route.ts` 在构建期生成，产物是 `out/sw.js`，
 * 注册地址是 `{basePath}/sw.js`；离线兜底页是普通的 App Router 页面 `/offline`。
 * 这三个常量同时被 Service Worker 注册、更新提示和离线提示使用。
 *
 * Service Worker 必须留在 basePath 根目录：它的作用域上限默认就是脚本所在目录，
 * 页面全在 basePath 下，脚本放深一层（例如 `/serwist/sw.js`）注册会被浏览器拒绝。
 */
export const serviceWorkerPath = withBasePath('/sw.js')

export const offlinePath = withBasePath('/offline')

/** Service Worker 的作用域：部署在根路径时就是整个站点。 */
export const serviceWorkerScope = withBasePath('/') || '/'
