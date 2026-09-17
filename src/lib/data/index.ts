import { requestDataset } from './client'
import { datasetEndpoints } from './endpoints'
import {
  activitySchema,
  itemsSchema,
  overviewSchema,
  type ActivityDataset,
  type ItemsDataset,
  type OverviewDataset,
} from './schemas'

/**
 * 页面只依赖这一层的函数，不直接碰 URL、fetch 和 schema。
 *
 * 每个函数都是 async：现在读静态 JSON，之后换成接口 / 数据库 / Server Action
 * 时签名不变，页面无需改动。
 */

export function getOverview(signal?: AbortSignal): Promise<OverviewDataset> {
  return requestDataset(datasetEndpoints.overview, overviewSchema, { signal })
}

export function getItems(signal?: AbortSignal): Promise<ItemsDataset> {
  return requestDataset(datasetEndpoints.items, itemsSchema, { signal })
}

export function getActivity(signal?: AbortSignal): Promise<ActivityDataset> {
  return requestDataset(datasetEndpoints.activity, activitySchema, { signal })
}

/**
 * 静态数据直接放在 public/ 下，编译期不参与打包，构建后依然可取到最新内容。
 * 想改成构建期渲染（SSG）时，把上面的函数换成服务端实现即可。
 */
export const datasetLoaders = {
  overview: getOverview,
  items: getItems,
  activity: getActivity,
} as const

export { DatasetError } from './client'
export type {
  ActivityDataset,
  ItemCategory,
  ItemsDataset,
  ItemStatus,
  OverviewDataset,
} from './schemas'
