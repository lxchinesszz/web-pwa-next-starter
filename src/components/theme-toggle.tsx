'use client'

import { MoonIcon, MonitorSmartphoneIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useMounted } from '@/hooks/use-mounted'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const options = [
  { value: 'light', label: '浅色', icon: SunIcon },
  { value: 'dark', label: '深色', icon: MoonIcon },
  { value: 'system', label: '跟随系统', icon: MonitorSmartphoneIcon },
] as const

/**
 * 三态主题切换：浅色 / 深色 / 跟随系统。
 *
 * 首帧不渲染真实图标 —— 服务端拿不到用户主题，直接渲染会在 hydration 时
 * 报不匹配；挂载后再切换图标即可，代价只是一次极短的占位。
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()

  const current = mounted ? theme : undefined
  const CurrentIcon = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="切换主题">
          <CurrentIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => setTheme(option.value)}
              className="gap-2"
              data-active={current === option.value}
            >
              <Icon className="size-4" />
              {option.label}
              {current === option.value ? (
                <span className="ml-auto text-xs text-muted-foreground">当前</span>
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
