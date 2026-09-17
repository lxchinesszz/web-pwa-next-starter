'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { appConfig } from '@app-config'
import { Separator } from '@/components/ui/separator'
import { isNavItemActive, navItems } from '@/lib/nav'
import { appVersion } from '@/lib/version'
import { cn } from '@/lib/utils'

/**
 * 左侧主导航。
 *
 * 宽屏（lg 及以上）展开成 240px 并显示描述文案；窄屏自动收成 64px 图标栏，
 * 而不是折叠成抽屉 —— 桌面应用里导航应当始终可见。
 * 高亮块用 Motion 的 layoutId 在条目之间滑动。
 */
export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 z-30 flex h-dvh w-16 shrink-0 flex-col border-r border-border/70 bg-sidebar lg:w-60">
      <Link
        href="/"
        className="flex h-14 items-center gap-2.5 px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:px-4"
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          {appConfig.shortName.slice(0, 1)}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="truncate text-sm font-semibold">{appConfig.shortName}</span>
          <span className="truncate text-[11px] text-muted-foreground">{appConfig.footerNote}</span>
        </span>
      </Link>

      <Separator />

      <nav aria-label="主导航" className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const active = isNavItemActive(item, pathname)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-2.5 py-2 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:px-3',
                active ? 'text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-nav-active"
                  className="absolute inset-0 -z-10 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                />
              ) : null}
              <Icon
                className="size-[18px] shrink-0"
                strokeWidth={active ? 2.4 : 1.9}
                aria-hidden
              />
              <span className="hidden min-w-0 flex-col lg:flex">
                <span className="truncate text-sm font-medium">{item.label}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      <p className="hidden px-4 py-3 text-[11px] text-muted-foreground lg:block">
        v{appVersion} · Next.js 16
      </p>
    </aside>
  )
}
