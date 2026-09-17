'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import {
  ArrowRightIcon,
  CheckIcon,
  DownloadIcon,
  RefreshCwIcon,
  SparklesIcon,
} from 'lucide-react'
import { appConfig } from '@app-config'
import { DataErrorState, DataSkeleton } from '@/components/data-state'
import { PageHeader } from '@/components/page-header'
import { useInstall } from '@/components/pwa/install-prompt'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDataset } from '@/hooks/use-dataset'
import { getOverview } from '@/lib/data'
import { navItems } from '@/lib/nav'
import { appVersion, formatBuildTime } from '@/lib/version'
import { cn } from '@/lib/utils'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

export function OverviewView() {
  const { data, error, status, isRefreshing, refresh } = useDataset('overview', getOverview)
  const { canPrompt, isStandalone, promptInstall } = useInstall()

  const total = data?.checklist.length ?? 0
  const done = data?.checklist.filter((entry) => entry.done).length ?? 0
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div className="space-y-6">
      <PageHeader
        title="概览"
        description={appConfig.description}
        action={
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
            <RefreshCwIcon className={cn('size-4', isRefreshing && 'animate-spin')} />
            刷新
          </Button>
        }
      />

      {status === 'error' ? <DataErrorState message={error ?? '未知错误'} onRetry={refresh} /> : null}

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* 品牌区：版本、构建时间与安装入口 */}
        <motion.div variants={item}>
          <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent">
            <CardContent className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <SparklesIcon className="size-3" />
                    Next.js 16 + Tailwind 4 + shadcn/ui
                  </Badge>
                  <Badge variant="outline">v{appVersion}</Badge>
                  <Badge variant="outline">构建于 {formatBuildTime()}</Badge>
                </div>
                <p className="max-w-2xl text-lg font-medium leading-snug">
                  {data?.app.tagline ?? appConfig.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  数据更新于 {data?.app.updatedAt ?? '—'} · 页面与静态资源均可离线访问
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {isStandalone ? (
                  <Badge variant="secondary" className="h-9 px-3">
                    已在独立窗口运行
                  </Badge>
                ) : (
                  <Button onClick={() => void promptInstall()} disabled={!canPrompt}>
                    <DownloadIcon className="size-4" />
                    安装到桌面
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {status === 'loading' && !data ? (
          <motion.div variants={item}>
            <DataSkeleton rows={2} />
          </motion.div>
        ) : null}

        {data ? (
          <>
            {/* 关键指标 */}
            <motion.div
              variants={item}
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {data.stats.map((stat) => (
                <Card key={stat.label} className="gap-1 py-5">
                  <CardContent className="space-y-1">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* 技术栈 + 完成度 */}
            <motion.div
              variants={item}
              className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">技术栈</CardTitle>
                  <CardDescription>每一层都只在一个地方配置</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {data.capabilities.map((capability) => (
                    <div
                      key={capability.id}
                      className="space-y-1.5 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{capability.title}</p>
                        <Badge variant="outline" className="shrink-0">
                          {capability.badge}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {capability.detail}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">模板完成度</CardTitle>
                  <CardDescription>
                    已完成 {done}/{total} 项
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={percent} />
                  <ul className="space-y-3">
                    {data.checklist.map((entry) => (
                      <li key={entry.title} className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full',
                            entry.done
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-dashed border-muted-foreground/60',
                          )}
                        >
                          {entry.done ? <CheckIcon className="size-3" /> : null}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">{entry.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : null}

        {/* 快速入口 */}
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">快速入口</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {navItems.slice(1).map((entry) => {
              const Icon = entry.icon
              return (
                <Link key={entry.href} href={entry.href} className="group outline-none">
                  <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40 group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50">
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Icon className="size-4 text-primary" />
                        <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-sm font-medium">{entry.label}</p>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </motion.div>

        <motion.p variants={item} className="pb-2 text-xs text-muted-foreground">
          {appConfig.footerNote} · 构建时间 {formatBuildTime()}
        </motion.p>
      </motion.div>
    </div>
  )
}
