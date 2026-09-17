import type { Metadata, Viewport } from 'next'
import { appConfig } from '@app-config'
import { AppShell } from '@/components/app-shell'
import { MotionProvider } from '@/components/motion-provider'
import { PwaProvider } from '@/components/pwa/pwa-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { withBasePath } from '@/lib/version'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s · ${appConfig.shortName}`,
  },
  description: appConfig.description,
  applicationName: appConfig.shortName,
  appleWebApp: {
    capable: true,
    title: appConfig.shortName,
    statusBarStyle: 'default',
  },
  // 不要在浏览器里自动把数字识别成电话号码 / 地址
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [
      { url: withBasePath('/favicon.ico'), sizes: 'any' },
      { url: withBasePath('/favicon.svg'), type: 'image/svg+xml' },
    ],
    apple: [{ url: withBasePath('/apple-touch-icon-180x180.png'), sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: appConfig.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  // 不限制缩放：桌面浏览器里禁用缩放会破坏无障碍（Ctrl +/- 与浏览器缩放菜单）
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={appConfig.lang} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            {/*
             * PwaProvider 必须包住页面：SerwistProvider / InstallProvider 提供的是
             * React Context，页面里的 useSerwist() / useInstall() 依赖它。
             * 写成兄弟节点时服务端预渲染会直接抛错。
             */}
            <PwaProvider>
              <AppShell>{children}</AppShell>
            </PwaProvider>
          </MotionProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
