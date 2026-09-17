'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * 是否已经完成客户端挂载。
 *
 * 用于「服务端渲染结果与客户端不一致」的场景（主题、localStorage 等）。
 * 用 useSyncExternalStore 而不是 `useEffect(() => setMounted(true), [])`：
 * 后者会在 effect 里同步 setState，触发一次级联渲染，新版的 react-hooks
 * 规则会直接报错。
 */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
