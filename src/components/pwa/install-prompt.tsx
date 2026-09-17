'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DownloadIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useIsStandalone } from '@/hooks/use-is-standalone'
import { useLocalStorageFlag } from '@/hooks/use-local-storage-flag'

/** Chrome / Edge 的安装事件，DOM 类型里还没有，按规范自己声明。 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt: () => Promise<void>
}

const DISMISS_KEY = 'pwa:install-banner-dismissed'

interface InstallContextValue {
  /** 浏览器已经允许弹出原生安装框（Chrome / Edge 桌面版在满足条件后才会给） */
  canPrompt: boolean
  /** 当前已经作为独立窗口在运行 */
  isStandalone: boolean
  promptInstall: () => Promise<void>
}

const InstallContext = createContext<InstallContextValue | null>(null)

export function InstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const isStandalone = useIsStandalone()

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      // 拦住浏览器自带的迷你信息条，改由应用内提示决定时机
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setDeferred(null)
      toast.success('已安装到桌面')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'accepted') {
      toast.success('已开始安装')
    } else {
      toast.info('已取消安装，随时可以从工具条右上角重新安装')
    }
  }, [deferred])

  const value = useMemo<InstallContextValue>(
    () => ({ canPrompt: deferred !== null, isStandalone, promptInstall }),
    [deferred, isStandalone, promptInstall],
  )

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>
}

export function useInstall() {
  const context = useContext(InstallContext)
  if (!context) {
    throw new Error('useInstall 必须在 <InstallProvider> 内部使用')
  }
  return context
}

/**
 * 桌面安装引导：右下角浮动卡片，不遮挡内容。
 * 用户点过「不再提示」后写入 localStorage，后续不再打扰。
 *
 * 浏览器只有在满足 PWA 可安装条件（manifest + Service Worker + 安全上下文）后
 * 才会派发 beforeinstallprompt，所以在 http 或未构建 SW 的开发环境里不会出现。
 */
export function InstallBanner() {
  const { canPrompt, isStandalone, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useLocalStorageFlag(DISMISS_KEY)

  if (isStandalone || dismissed || !canPrompt) return null

  return (
    <Card className="fixed right-6 bottom-6 z-40 w-80 gap-0 border-primary/30 py-4 shadow-lg">
      <CardContent className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <DownloadIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">安装到桌面</p>
          <p className="text-xs text-muted-foreground">
            以独立窗口运行，支持离线访问与任务栏固定。
          </p>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={() => void promptInstall()}>
              安装
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              不再提示
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="关闭" onClick={() => setDismissed(true)}>
          <XIcon className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
