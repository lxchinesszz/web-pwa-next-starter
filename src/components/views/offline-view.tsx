'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CloudDownloadIcon, HouseIcon, RefreshCwIcon, WifiOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * 离线兜底页：由 Service Worker 预缓存，断网时替代浏览器的错误页。
 * 只依赖本地状态，不发任何请求。
 */
export function OfflineView() {
  const online = useNetworkStatus()
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)

  // 网络恢复后自动回到首页，避免用户停留在兜底页
  useEffect(() => {
    if (online) {
      const timer = setTimeout(() => {
        window.location.replace('/')
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [online])

  const retry = () => {
    setChecking(true)
    setLastCheck(new Date().toLocaleTimeString())
    setTimeout(() => {
      setChecking(false)
      if (navigator.onLine) {
        window.location.replace('/')
      }
    }, 500)
  }

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground"
      >
        <WifiOffIcon className="size-7" />
      </motion.div>

      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold">
          {online ? '网络已恢复' : '当前处于离线状态'}
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {online
            ? '正在返回首页…'
            : '已缓存的页面和静态数据仍然可以浏览，联网后会自动恢复。'}
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CloudDownloadIcon className="size-4" />
            这个页面由 Service Worker 预缓存提供
          </div>
          {lastCheck ? (
            <p className="text-xs text-muted-foreground">上次重试：{lastCheck}</p>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={retry} disabled={checking} className="flex-1">
              <RefreshCwIcon className={checking ? 'size-4 animate-spin' : 'size-4'} />
              重试
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <HouseIcon className="size-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
