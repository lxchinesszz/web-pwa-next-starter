'use client'

import { useSyncExternalStore } from 'react'

/**
 * 在线状态。
 *
 * 用 useSyncExternalStore 订阅 online/offline 事件：SSR 与 hydration 阶段
 * 返回 true（按在线渲染，避免首屏闪出「离线」），订阅建立后立刻拿到真实值。
 */
function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

export function useNetworkStatus() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
