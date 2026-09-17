'use client'

import { useCallback, useSyncExternalStore } from 'react'

const eventName = (key: string) => `app:storage:${key}`

/**
 * 把 localStorage 里的一个布尔标记接入 React。
 *
 * 同一个页面内写入时派发自定义事件，跨标签页切换时由 storage 事件同步。
 * 快照是布尔值，引用稳定，不会引发额外渲染。
 */
export function useLocalStorageFlag(key: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = () => onChange()
      window.addEventListener('storage', handler)
      window.addEventListener(eventName(key), handler)
      return () => {
        window.removeEventListener('storage', handler)
        window.removeEventListener(eventName(key), handler)
      }
    },
    [key],
  )

  const getSnapshot = useCallback(() => window.localStorage.getItem(key) === '1', [key])

  const value = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const setValue = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(key, next ? '1' : '0')
      window.dispatchEvent(new Event(eventName(key)))
    },
    [key],
  )

  return [value, setValue] as const
}
