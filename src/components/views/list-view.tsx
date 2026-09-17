'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { RefreshCwIcon, SearchIcon } from 'lucide-react'
import { DataEmptyState, DataErrorState, DataSkeleton } from '@/components/data-state'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataset } from '@/hooks/use-dataset'
import { getItems, type ItemCategory } from '@/lib/data'
import { cn } from '@/lib/utils'

type CategoryFilter = ItemCategory | 'all'

const categoryLabels: Record<CategoryFilter, string> = {
  all: '全部',
  framework: '框架',
  style: '样式',
  pwa: 'PWA',
  motion: '动效',
}

const statusLabels = {
  stable: { label: '稳定', variant: 'secondary' as const },
  beta: { label: '测试', variant: 'outline' as const },
  planned: { label: '计划', variant: 'destructive' as const },
}

export function ListView() {
  const { data, error, status, isRefreshing, refresh } = useDataset('items', getItems)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [keyword, setKeyword] = useState('')

  const items = useMemo(() => {
    const source = data?.items ?? []
    const trimmed = keyword.trim().toLowerCase()

    return source.filter((entry) => {
      const matchCategory = category === 'all' || entry.category === category
      if (!matchCategory) return false
      if (!trimmed) return true
      return (
        entry.title.toLowerCase().includes(trimmed) ||
        entry.summary.toLowerCase().includes(trimmed) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(trimmed))
      )
    })
  }, [data, category, keyword])

  return (
    <div className="space-y-6">
      <PageHeader
        title="列表"
        description="静态数据 + 组合筛选 + 骨架屏，卡片网格在宽屏下自适应列数"
      />

      {/* 工具条：搜索 + 分类 + 刷新 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索标题、摘要或标签"
            className="pl-9"
            aria-label="搜索"
          />
        </div>
        <Tabs value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
          <TabsList>
            {(Object.keys(categoryLabels) as CategoryFilter[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {categoryLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={refresh}
          disabled={isRefreshing}
        >
          <RefreshCwIcon className={cn('size-4', isRefreshing && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {status === 'error' ? <DataErrorState message={error ?? '未知错误'} onRetry={refresh} /> : null}

      {status === 'loading' && !data ? <DataSkeleton rows={3} /> : null}

      {data ? (
        <>
          <p className="text-xs text-muted-foreground">
            共 {data.total} 条，命中 {items.length} 条
            {isRefreshing ? '（刷新中…）' : ''}
          </p>

          {items.length === 0 ? (
            <DataEmptyState title="没有匹配的条目" description="换个关键词或切换分类试试" />
          ) : null}

          <motion.ul
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          >
            <AnimatePresence initial={false}>
              {items.map((entry) => {
                const statusMeta = statusLabels[entry.status]
                return (
                  <motion.li
                    key={entry.id}
                    layout
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="h-full"
                  >
                    <Card className="flex h-full flex-col transition-colors hover:border-primary/40">
                      <CardContent className="flex flex-1 flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium leading-snug">{entry.title}</p>
                          <Badge variant={statusMeta.variant} className="shrink-0">
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                          {entry.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary">{categoryLabels[entry.category]}</Badge>
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>完成度 {entry.score}</span>
                            <span>更新于 {entry.updatedAt}</span>
                          </div>
                          <Progress value={entry.score} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </motion.ul>
        </>
      ) : null}
    </div>
  )
}
