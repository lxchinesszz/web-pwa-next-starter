import type { MetadataRoute } from 'next'
import { appConfig } from '@app-config'
import { withBasePath } from '@/lib/version'

/**
 * Next.js 约定文件：自动生成 `/manifest.webmanifest` 并注入 <link rel="manifest">。
 * 所有字段都来自 app.config.ts，不要在这里写死应用信息。
 */
// 静态导出（output: 'export'）时，路由处理器必须显式声明为静态；
// 常规构建下这个声明同样成立，manifest 本来就不依赖请求信息。
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  const base = appConfig.basePath || ''

  return {
    id: `${base}/`,
    name: appConfig.name,
    short_name: appConfig.shortName,
    description: appConfig.description,
    lang: appConfig.lang,
    dir: 'ltr',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    // 桌面版 Chrome / Edge 支持把标题栏交给页面自己画（配合 CSS 的 titlebar-area-*），
    // 不支持时自动退回 standalone。
    display_override: ['window-controls-overlay', 'standalone'],
    // 不锁定方向：桌面窗口可以自由缩放
    orientation: 'any',
    theme_color: appConfig.themeColor,
    background_color: appConfig.backgroundColor,
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: withBasePath('/pwa-64x64.png'),
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: withBasePath('/pwa-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: withBasePath('/maskable-icon-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
