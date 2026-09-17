'use client'

import { ChevronRightIcon, DownloadIcon, WifiIcon, WifiOffIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { appConfig } from '@app-config'
import { useInstall } from '@/components/pwa/install-prompt'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { findActiveNavItem } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * 顶部工具条：左侧面包屑，右侧全局操作（网络状态、安装、主题）。
 * 页面自己的标题与操作按钮留在页面内（PageHeader），避免和工具条重复。
 */
export function AppToolbar() {
  const pathname = usePathname()
  const active = findActiveNavItem(pathname)
  const online = useNetworkStatus()
  const { canPrompt, isStandalone, promptInstall } = useInstall()

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-lg lg:px-8">
      <nav aria-label="面包屑" className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">{appConfig.shortName}</span>
        <ChevronRightIcon className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:block" />
        <span className="truncate font-medium">{active?.label ?? '页面'}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={online ? '当前在线' : '当前离线'}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
                online
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              )}
            >
              {online ? <WifiIcon className="size-3.5" /> : <WifiOffIcon className="size-3.5" />}
              <span className="hidden lg:inline">{online ? '在线' : '离线'}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {online ? '数据实时拉取' : '正在使用预缓存内容'}
          </TooltipContent>
        </Tooltip>

        {!isStandalone ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canPrompt}
                  onClick={() => void promptInstall()}
                >
                  <DownloadIcon className="size-4" />
                  <span className="hidden lg:inline">安装应用</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {canPrompt ? '以独立窗口安装到桌面' : '请使用 Chrome / Edge 地址栏右侧的安装图标'}
            </TooltipContent>
          </Tooltip>
        ) : null}

        <ThemeToggle />
      </div>
    </header>
  )
}
