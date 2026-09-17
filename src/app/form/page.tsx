import type { Metadata } from 'next'
import { FormView } from '@/components/views/form-view'

export const metadata: Metadata = {
  title: '表单',
  description: 'react-hook-form + zod + shadcn/ui 受控组件示例。',
}

export default function FormPage() {
  return <FormView />
}
