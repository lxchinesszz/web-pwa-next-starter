import type { Metadata } from 'next'
import { ListView } from '@/components/views/list-view'

export const metadata: Metadata = {
  title: '列表',
  description: '静态数据、筛选、骨架屏与错峰入场动画。',
}

export default function ListPage() {
  return <ListView />
}
