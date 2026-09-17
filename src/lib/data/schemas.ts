import { z } from 'zod'

/**
 * 静态数据集的 schema。
 *
 * 为什么要有它：`public/data/*.json` 在编译期没有任何类型约束，页面拿到的
 * 是 `any`。统一在这里描述结构，读取时用 zod 校验一次，之后全链路都有类型，
 * 后期把数据换成真实接口时，接口返回不规范会立刻报错而不是静默渲染出空白。
 */

export const overviewSchema = z.object({
  app: z.object({
    tagline: z.string(),
    version: z.string(),
    updatedAt: z.string(),
  }),
  stats: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      hint: z.string(),
    }),
  ),
  checklist: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      done: z.boolean(),
    }),
  ),
  capabilities: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      detail: z.string(),
      badge: z.string(),
    }),
  ),
})

export const itemsSchema = z.object({
  updatedAt: z.string(),
  total: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      category: z.enum(['framework', 'style', 'pwa', 'motion']),
      status: z.enum(['stable', 'beta', 'planned']),
      tags: z.array(z.string()),
      score: z.number().min(0).max(100),
      updatedAt: z.string(),
    }),
  ),
})

export const activitySchema = z.object({
  updatedAt: z.string(),
  range: z.object({ label: z.string(), days: z.number().int().positive() }),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      unit: z.string(),
      target: z.number(),
      trend: z.enum(['up', 'down', 'flat']),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      detail: z.string(),
      time: z.string(),
      type: z.enum(['build', 'release', 'sync', 'alert']),
    }),
  ),
})

export type OverviewDataset = z.infer<typeof overviewSchema>
export type ItemsDataset = z.infer<typeof itemsSchema>
export type ActivityDataset = z.infer<typeof activitySchema>
export type ItemCategory = ItemsDataset['items'][number]['category']
export type ItemStatus = ItemsDataset['items'][number]['status']
