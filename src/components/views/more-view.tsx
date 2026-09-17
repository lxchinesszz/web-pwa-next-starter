'use client'

import { useSerwist } from '@serwist/turbopack/react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import {
  CircleHelpIcon,
  CopyIcon,
  DownloadIcon,
  InfoIcon,
  MoonIcon,
  PaletteIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { appConfig } from '@app-config'
import { PageHeader } from '@/components/page-header'
import { useInstall } from '@/components/pwa/install-prompt'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsStandalone } from '@/hooks/use-is-standalone'
import { useMounted } from '@/hooks/use-mounted'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { serviceWorkerPath } from '@/lib/pwa'
import { appVersion, buildTime, formatBuildTime } from '@/lib/version'

const themeOptions = [
  { value: 'light', label: '浅色', icon: SunIcon },
  { value: 'dark', label: '深色', icon: MoonIcon },
  { value: 'system', label: '跟随系统', icon: PaletteIcon },
]

function subscribeServiceWorker(onChange: () => void) {
  if (!('serviceWorker' in navigator)) return () => {}
  navigator.serviceWorker.addEventListener('controllerchange', onChange)
  return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange)
}

/** 当前页面是否已经被 Service Worker 接管。 */
function useServiceWorkerReady() {
  return useSyncExternalStore(
    subscribeServiceWorker,
    () => Boolean(navigator.serviceWorker?.controller),
    () => false,
  )
}

export function MoreView() {
  const { theme, setTheme } = useTheme()
  const { serwist } = useSerwist()
  const online = useNetworkStatus()
  const isStandalone = useIsStandalone()
  const { canPrompt, promptInstall } = useInstall()

  const mounted = useMounted()
  const swReady = useServiceWorkerReady()
  const [caches, setCaches] = useState<string[]>([])
  const [checking, setChecking] = useState(false)

  const readCacheNames = useCallback(async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return []
    return window.caches.keys()
  }, [])

  useEffect(() => {
    let active = true
    void readCacheNames().then((names) => {
      if (active) setCaches(names)
    })
    return () => {
      active = false
    }
  }, [readCacheNames])

  /**
   * 手动检查更新。
   *
   * 不能只弹「已检查更新」：`registration.update()` 只负责发起检查，
   * 新版本还要下载安装，所以这里把三种状态分开说清楚。
   */
  const checkForUpdate = async () => {
    if (!serwist) return
    setChecking(true)
    try {
      const registration =
        (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready)
      await registration.update()

      if (registration.waiting) {
        toast.info('发现新版本', {
          description: '点「立即更新」后页面会自动刷新，未提交的表单内容不会保留。',
          duration: Number.POSITIVE_INFINITY,
          action: {
            label: '立即更新',
            onClick: () => {
              navigator.serviceWorker.addEventListener(
                'controllerchange',
                () => window.location.reload(),
                { once: true },
              )
              serwist.messageSkipWaiting()
            },
          },
        })
      } else if (registration.installing) {
        toast.info('正在下载新版本', { description: '装好后会自动弹出更新提示' })
      } else {
        toast.success('已是最新版本', { description: `当前构建时间：${formatBuildTime(buildTime)}` })
      }
    } catch {
      toast.error('检查更新失败', { description: '网络异常或部署节点未就绪，请稍后再试' })
    } finally {
      setChecking(false)
    }
  }

  const clearCaches = async () => {
    if (!('caches' in window)) return
    const names = await window.caches.keys()
    await Promise.all(names.map((name) => window.caches.delete(name)))
    setCaches([])
    toast.success('已清空运行时缓存', { description: 'Service Worker 仍然保留，下次访问会重新填充' })
  }

  const copySwPath = async () => {
    await navigator.clipboard.writeText(new URL(serviceWorkerPath, window.location.origin).href)
    toast.success('已复制 Service Worker 地址')
  }

  const installStateLabel = isStandalone
    ? '已作为独立窗口运行'
    : canPrompt
      ? '可以一键安装'
      : '待浏览器判定可安装（或用地址栏安装图标）'

  return (
    <div className="space-y-6">
      <PageHeader title="更多" description="外观、PWA 运行状态与模板信息" />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* 外观 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <PaletteIcon className="size-4 text-primary" />
              外观
            </CardTitle>
            <CardDescription>
              由 next-themes 写入 html 的 <code className="text-xs">.dark</code> 类，与 Tailwind 变体联动
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <ToggleGroup
                type="single"
                value={theme ?? 'system'}
                onValueChange={(value) => value && setTheme(value)}
                variant="outline"
                className="w-full"
              >
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <ToggleGroupItem key={option.value} value={option.value} className="gap-2">
                      <Icon className="size-4" />
                      {option.label}
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            ) : (
              <div className="h-9 animate-pulse rounded-md bg-muted" />
            )}
          </CardContent>
        </Card>

        {/* PWA 状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheckIcon className="size-4 text-primary" />
              PWA 状态
            </CardTitle>
            <CardDescription>安装、离线与缓存的实际运行情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="安装状态" value={installStateLabel} />
            <StatusRow
              label="Service Worker"
              value={swReady ? '已接管当前页面' : '未接管（刷新后生效）'}
            />
            <StatusRow
              label="网络"
              value={online ? '在线' : '离线'}
              icon={online ? WifiIcon : WifiOffIcon}
            />
            <StatusRow
              label="运行时缓存"
              value={
                caches.length > 0
                  ? `${caches.length} 个：${caches.slice(0, 2).join('、')}${caches.length > 2 ? '…' : ''}`
                  : '尚未创建'
              }
            />

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void checkForUpdate()}
                disabled={checking || !serwist}
              >
                <RefreshCwIcon className={checking ? 'size-4 animate-spin' : 'size-4'} />
                检查更新
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void clearCaches()}
                disabled={caches.length === 0}
              >
                <Trash2Icon className="size-4" />
                清空缓存
              </Button>
              <Button size="sm" onClick={() => void promptInstall()} disabled={isStandalone || !canPrompt}>
                <DownloadIcon className="size-4" />
                安装应用
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void copySwPath()}>
                <CopyIcon className="size-4" />
                复制 SW 地址
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 交互组件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">交互组件</CardTitle>
            <CardDescription>抽屉、对话框都来自 shadcn/ui，鼠标与触屏通用</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <InfoIcon className="size-4" />
                  打开抽屉
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>手势抽屉</DrawerTitle>
                  <DrawerDescription>
                    由 vaul 驱动：可以直接拖拽关闭，桌面端与触屏端共用一套代码。
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 text-sm text-muted-foreground">
                  在这里放筛选器、操作菜单或详情内容都很合适。
                </div>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button variant="outline">关闭</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <InfoIcon className="size-4" />
                  打开对话框
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{appConfig.name}</DialogTitle>
                  <DialogDescription>{appConfig.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <StatusRow label="版本" value={appVersion} />
                  <StatusRow label="构建时间" value={formatBuildTime(buildTime)} />
                  <StatusRow label="部署前缀" value={appConfig.basePath || '根路径 /'} mono />
                  <StatusRow label="界面语言" value={appConfig.lang} />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* 关于模板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <InfoIcon className="size-4 text-primary" />
              关于模板
            </CardTitle>
            <CardDescription>这些值全部来自根目录的 app.config.ts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="应用名称" value={appConfig.name} />
            <StatusRow label="短名称" value={appConfig.shortName} />
            <StatusRow label="slug" value={appConfig.slug} mono />
            <StatusRow label="版本" value={appVersion} />
            <StatusRow label="构建时间" value={formatBuildTime(buildTime)} />
            <StatusRow label="主题色" value={appConfig.themeColor} mono />
            <StatusRow label="部署前缀" value={appConfig.basePath || '根路径 /'} mono />
            <StatusRow label="页脚" value={appConfig.footerNote} />
            <Separator />
            <div className="flex items-center gap-2">
              <Badge variant="outline">Next.js 16</Badge>
              <Badge variant="outline">Tailwind 4</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
              <Badge variant="outline">Motion</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 常见问题 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CircleHelpIcon className="size-4 text-primary" />
            常见问题
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="data">
              <AccordionTrigger>数据从哪里来？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  目前全部来自 <code>public/data/*.json</code>，由 <code>src/lib/data/</code> 统一读取
                  并用 zod 校验。换成真实接口时只改 <code>endpoints.ts</code>，页面代码不动。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="offline">
              <AccordionTrigger>离线时能看到什么？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  静态资源与 <code>public/</code> 下的 JSON 会被预缓存；导航请求失败时回退到{' '}
                  <code>/offline</code>。已经访问过的页面由 NetworkFirst 策略兜底。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="update">
              <AccordionTrigger>为什么更新不自动生效？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  为了让用户不被打断，新版本会停在 waiting 状态，需要点击提示里的「立即更新」才会
                  skipWaiting 并刷新。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="install">
              <AccordionTrigger>为什么装不上 / 没有安装按钮？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Chrome / Edge 只在满足条件后才派发安装事件：必须是 <code>https</code> 或{' '}
                  <code>localhost</code>，并且 Service Worker 已注册成功。开发服务器下 Service
                  Worker 没有预缓存清单，建议用 <code>pnpm build &amp;&amp; pnpm start</code> 验证。
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="base">
              <AccordionTrigger>怎么部署到子目录？</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  把 <code>app.config.ts</code> 的 <code>basePath</code> 改成{' '}
                  <code>&apos;/my-app&apos;</code> 即可，manifest 的 scope、start_url 与图标路径会自动
                  跟随。
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusRow({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string
  value: string
  icon?: typeof WifiIcon
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </span>
      <span className={mono ? 'max-w-[65%] truncate font-mono' : 'truncate font-medium'}>{value}</span>
    </div>
  )
}
