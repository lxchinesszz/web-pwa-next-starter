'use client'

import { CircleAlertIcon, InboxIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** 数据加载中的骨架屏：结构上贴合真实卡片，避免加载完成时布局跳动。 */
export function DataSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** 读取失败：把原始错误直接展示出来，方便定位是网络还是 schema 不匹配。 */
export function DataErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <CircleAlertIcon className="size-4" />
          <p className="text-sm font-medium">数据读取失败</p>
        </div>
        <p className="text-sm break-words text-muted-foreground">{message}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCwIcon className="size-4" />
            重新加载
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** 筛选/搜索后没有结果时的空态。 */
export function DataEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
        <InboxIcon className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  )
}
