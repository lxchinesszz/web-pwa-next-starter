'use client'

import { SerwistProvider } from '@serwist/turbopack/react'
import type { ReactNode } from 'react'
import { InstallBanner, InstallProvider } from '@/components/pwa/install-prompt'
import { OfflineNotice } from '@/components/pwa/offline-notice'
import { UpdatePrompt } from '@/components/pwa/update-prompt'
import { serviceWorkerPath, serviceWorkerScope } from '@/lib/pwa'

/**
 * PWA 运行时总入口，挂在 root layout 上并**包住页面**：
 * 页面里的 useSerwist() / useInstall() 依赖这里提供的 Context。
 *
 * `reloadOnOnline={false}` 是刻意的：Serwist 默认会在网络恢复时直接 reload，
 * 用户正在填的表单会被清空。需要刷新的场景交给 UpdatePrompt 与 OfflineNotice 提示用户决定。
 */
export function PwaProvider({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl={serviceWorkerPath}
      options={{ scope: serviceWorkerScope }}
      reloadOnOnline={false}
      cacheOnNavigation
    >
      <InstallProvider>
        {children}
        <UpdatePrompt />
        <OfflineNotice />
        <InstallBanner />
      </InstallProvider>
    </SerwistProvider>
  )
}
