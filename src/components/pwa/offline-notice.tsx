'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * 网络状态提示：断网时给一条常驻提示，恢复后自动收起。
 * 页面的数据请求本身有错误态，这里只负责“解释为什么”。
 */
export function OfflineNotice() {
  const online = useNetworkStatus()
  const toastIdRef = useRef<string | number | null>(null)
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true
      if (toastIdRef.current === null) {
        toastIdRef.current = toast.warning('当前处于离线状态', {
          description: '已缓存的内容仍可浏览，联网后会自动恢复。',
          duration: Number.POSITIVE_INFINITY,
        })
      }
      return
    }

    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false
      toast.success('网络已恢复')
    }
  }, [online])

  return null
}
