'use client'

import { useSyncExternalStore } from 'react'

function readIsStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function subscribe(onChange: () => void) {
  // 安装完成后 display-mode 会变化，这里只需要在 appinstalled 时通知一次
  window.addEventListener('appinstalled', onChange)
  return () => window.removeEventListener('appinstalled', onChange)
}

/**
 * 当前是否已经作为独立窗口（PWA）运行。
 * 快照是布尔值，引用稳定，满足 useSyncExternalStore 的要求。
 */
export function useIsStandalone() {
  return useSyncExternalStore(subscribe, readIsStandalone, () => false)
}
