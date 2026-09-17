'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * next-themes 的封装：`attribute="class"` 会给 <html> 加 `.dark`，
 * 与 src/app/globals.css 里 `@custom-variant dark (&:is(.dark *))` 对应。
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
