'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { AppToolbar } from '@/components/app-toolbar'
import { PageTransition } from '@/components/page-transition'

/**
 * 桌面应用外壳：左侧常驻导航 + 顶部工具条 + 可滚动内容区。
 *
 * 内容区用 max-w 限制超宽屏下的行宽（1440px），再宽就留白而不是把卡片拉扁；
 * `min-w-0` 是必须的 —— 否则内部的表格 / 长文本会把 flex 子项撑破。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppToolbar />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <PageTransition routeKey={pathname}>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
