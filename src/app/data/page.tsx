import type { Metadata } from 'next'
import { DataView } from '@/components/views/data-view'

export const metadata: Metadata = {
  title: '数据',
  description: '静态数据层：endpoints、zod 校验与刷新状态。',
}

export default function DataPage() {
  return <DataView />
}
