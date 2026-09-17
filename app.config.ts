/**
 * 应用元数据的唯一来源。
 *
 * 由 scripts/init-app.mjs 生成，也可以手工修改。
 * 这里的字段会被 next.config.ts、src/app/layout.tsx、src/app/manifest.ts 读取，
 * 不要在页面里重复写死。
 */
export const appConfig = {
  "name": "web-pwa-next演示网站",
  "shortName": "web-pwa-next演示网站",
  "description": "使用 AI 快速生成旅行计划",
  "slug": "web-pwa-next-starter",
  "lang": "zh-CN",
  "themeColor": "#863bff",
  "backgroundColor": "#ffffff",
  "basePath": "/web-pwa-next-starter",
  "footerNote": "Next.js PWA 应用"
} as const

export type AppConfig = typeof appConfig
