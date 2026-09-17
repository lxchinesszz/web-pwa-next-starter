/**
 * 数据集地址表 —— 静态数据阶段与真实接口阶段的唯一接缝。
 *
 * 现在指向 `public/data/` 下的静态 JSON；接入后端时把值换成 API 路径即可，
 * 页面与 hooks 不需要任何改动。需要鉴权 / 自定义 header 时，在
 * `client.ts` 的 `requestDataset` 里统一加。
 */
export const datasetEndpoints = {
  overview: '/data/overview.json',
  items: '/data/items.json',
  activity: '/data/activity.json',
} as const

export type DatasetKey = keyof typeof datasetEndpoints
