'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import {
  ArrowDownRightIcon,
  ChevronDownIcon,
  MinusIcon,
  PackageIcon,
  RefreshCwIcon,
  RocketIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { DataErrorState, DataSkeleton } from '@/components/data-state'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDataset } from '@/hooks/use-dataset'
import { getActivity } from '@/lib/data'
import { datasetEndpoints } from '@/lib/data/endpoints'
import { cn } from '@/lib/utils'

const trendMeta = {
  up: { icon: TrendingUpIcon, className: 'text-emerald-500', label: '上升' },
  down: { icon: ArrowDownRightIcon, className: 'text-sky-500', label: '下降' },
  flat: { icon: MinusIcon, className: 'text-muted-foreground', label: '持平' },
}

const eventMeta = {
  build: { icon: PackageIcon, className: 'text-primary', label: '构建' },
  release: { icon: RocketIcon, className: 'text-emerald-500', label: '发布' },
  sync: { icon: RefreshCwIcon, className: 'text-sky-500', label: '同步' },
  alert: { icon: TriangleAlertIcon, className: 'text-amber-500', label: '告警' },
}

export function DataView() {
  const { data, error, status, isRefreshing, refresh } = useDataset('activity', getActivity)
  const [rawOpen, setRawOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader
        title="数据"
        description="统一的静态数据层：endpoints → client → schema，换接口只改一层"
        action={
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
            <RefreshCwIcon className={cn('size-4', isRefreshing && 'animate-spin')} />
            刷新
          </Button>
        }
      />

      {status === 'error' ? <DataErrorState message={error ?? '未知错误'} onRetry={refresh} /> : null}
      {status === 'loading' && !data ? <DataSkeleton rows={2} /> : null}

      {data ? (
        <>
          <motion.div
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {data.metrics.map((metric) => {
              const trend = trendMeta[metric.trend]
              const TrendIcon = trend.icon
              // LCP 这类指标越小越好，进度条按 target/value 反算
              const isInverse = metric.label.includes('LCP')
              const ratio = isInverse
                ? Math.min(100, Math.round((metric.target / Math.max(metric.value, 1)) * 100))
                : Math.min(100, Math.round((metric.value / metric.target) * 100))

              return (
                <motion.div
                  key={metric.label}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                >
                  <Card className="h-full py-5">
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <TrendIcon className={cn('size-3.5', trend.className)} />
                      </div>
                      <p className="text-2xl font-semibold tracking-tight">
                        {metric.value}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {metric.unit}
                        </span>
                      </p>
                      <Progress value={ratio} className="h-1.5" />
                      <p className="text-[11px] text-muted-foreground">
                        目标 {metric.target}
                        {metric.unit} · {trend.label}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="py-0">
              <CardHeader className="pt-6">
                <CardTitle className="text-sm">最近事件</CardTitle>
                <CardDescription>
                  {data.range.label}（{data.range.days} 天） · 更新于 {data.updatedAt.slice(0, 10)}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>事件</TableHead>
                      <TableHead className="w-24">类型</TableHead>
                      <TableHead className="w-32 text-right">时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.events.map((event) => {
                      const meta = eventMeta[event.type]
                      const Icon = meta.icon
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.detail}</p>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-xs">
                              <Icon className={cn('size-3.5 shrink-0', meta.className)} />
                              {meta.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {event.time}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* 这一层就是「后期换真实接口」的接缝 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">数据源</CardTitle>
                  <CardDescription>
                    修改 <code className="text-xs">src/lib/data/endpoints.ts</code> 即可切到真实接口
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(datasetEndpoints).map(([key, url]) => (
                    <div key={key} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium">{key}</span>
                      <code className="truncate text-muted-foreground">{url}</code>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 原始响应：校验失败时可以直接对照 schema 排查 */}
              <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
                <Card className="py-4">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-6 text-sm font-medium">
                    原始数据
                    <ChevronDownIcon
                      className={cn('size-4 transition-transform', rawOpen && 'rotate-180')}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-4">
                      <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
