'use client'

import { useCallback, useEffect, useState } from 'react'

export type DatasetState<T> = {
  data: T | null
  error: string | null
  status: 'loading' | 'success' | 'error'
  isRefreshing: boolean
}

export type DatasetResult<T> = DatasetState<T> & {
  /** 重新拉取；保留旧数据，只把 isRefreshing 置为 true，避免页面闪烁。 */
  refresh: () => void
}

/** 已完成的请求快照。key 用于判断它是不是当前这次请求的结果。 */
interface Snapshot<T> {
  requestKey: string
  data: T | null
  error: string | null
}

/**
 * 读取数据集的通用 hook。
 *
 * - `key` 变化（例如切换筛选条件）时自动重新请求；
 * - 组件卸载或 key 变化时 abort 掉进行中的请求；
 * - 不做「在 effect 里同步 setState」：加载态由 `snapshot.requestKey` 与当前
 *   `requestKey` 是否一致推导出来，避免级联渲染；
 * - `loader` 需要是稳定引用（模块级函数即可），页面不需要包 useCallback。
 */
export function useDataset<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
): DatasetResult<T> {
  const [nonce, setNonce] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)

  const requestKey = `${key}#${nonce}`

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    loader(controller.signal)
      .then((data) => {
        if (!active) return
        setSnapshot({ requestKey, data, error: null })
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        setSnapshot({
          requestKey,
          data: null,
          error: error instanceof Error ? error.message : '未知错误',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [requestKey, loader])

  const current = snapshot?.requestKey === requestKey ? snapshot : null
  const stale = snapshot && snapshot.requestKey !== requestKey ? snapshot : null

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  return {
    data: current ? current.data : (stale?.data ?? null),
    error: current?.error ?? null,
    status: current ? (current.error ? 'error' : 'success') : 'loading',
    isRefreshing: current === null && stale !== null,
    refresh,
  }
}
