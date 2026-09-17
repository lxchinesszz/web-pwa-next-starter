import type { Metadata } from 'next'
import { OfflineView } from '@/components/views/offline-view'

export const metadata: Metadata = {
  title: '离线',
  description: '网络不可用时的兜底页面。',
}

/**
 * 离线兜底页。
 *
 * 这个页面会被 Service Worker 显式预缓存（见 src/app/serwist/[path]/route.ts），
 * 当导航请求失败时由 fallbacks 策略接管。因此它不能依赖任何运行时接口数据。
 */
export default function OfflinePage() {
  return <OfflineView />
}
