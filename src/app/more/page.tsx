import type { Metadata } from 'next'
import { MoreView } from '@/components/views/more-view'

export const metadata: Metadata = {
  title: '更多',
  description: '主题切换、PWA 状态与模板信息。',
}

export default function MorePage() {
  return <MoreView />
}
