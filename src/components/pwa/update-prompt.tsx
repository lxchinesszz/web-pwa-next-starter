'use client'

import { useSerwist } from '@serwist/turbopack/react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * 主动检查新版本的间隔。
 *
 * 不能只靠浏览器：`navigator.serviceWorker.register()` 对「已存在且脚本 URL 相同」的
 * registration 直接 resolve，不会触发检查；浏览器自己的软更新只在导航时做，而且同一个
 * registration 24 小时内最多检查一次（Service Worker 规范里的 stale 判定）。
 * 桌面安装版最常见的用法就是「打开后一直挂着」，等导航等不到，等 24 小时又太久，
 * 结果就是发版后应用从不提醒。这里改成：启动、回到前台、联网恢复、每 30 分钟各查一次。
 */
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000

/** 回到前台时的最短检查间隔，避免频繁切窗口时每次都发请求。 */
const MIN_CHECK_INTERVAL = 60 * 1000

/**
 * 点「稍后」之后的静默时长。
 *
 * 不能整个会话都静默：桌面安装版可能几天不关，那样用户永远等不到下一次提醒；
 * 也不该每 30 分钟就弹一次，太吵。两小时后再说。
 */
const SNOOZE_DURATION = 2 * 60 * 60 * 1000

/** 当前页面所属的 registration；provider 的 register() 还没结束时等它注册完。 */
async function resolveRegistration() {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? navigator.serviceWorker.ready
}

/**
 * 新版本就绪提示。
 *
 * Service Worker 里 `skipWaiting: false`，所以新版本会停在 waiting 状态，
 * 由这里的「立即更新」按钮显式触发 skipWaiting，再由 controllerchange 刷新页面。
 * 这样不会出现「用户正在填表单，页面突然自己刷新了」。
 *
 * 检测不用 Serwist 的 `waiting` 事件：`@serwist/window` 在第一次「外部触发」的更新之后
 * 会摘掉自己的 updatefound 监听（见其 _onUpdateFound），长会话里的第二次发版就收不到事件了。
 * 这里直接监听 registration 的 updatefound / statechange + 检查 registration.waiting。
 */
export function UpdatePrompt() {
  const { serwist } = useSerwist()
  const toastIdRef = useRef<string | number | null>(null)
  /** 用户点过「稍后」的那个新版本，以及静默到期时间。 */
  const snoozedRef = useRef<{ worker: ServiceWorker; until: number } | null>(null)
  /**
   * 只有用户点了「立即更新」才刷新页面。
   * 首次安装时 `clientsClaim: true` 同样会触发 controllerchange，那时刷新纯属打扰。
   */
  const acceptedRef = useRef(false)

  useEffect(() => {
    if (!serwist || !('serviceWorker' in navigator)) return

    let disposed = false
    let registration: ServiceWorkerRegistration | null = null
    let lastCheckAt = 0
    let timer: number | undefined

    const promptForUpdate = (worker: ServiceWorker) => {
      if (disposed || toastIdRef.current !== null) return
      const snoozed = snoozedRef.current
      // 换了新版本就立即提醒，不受旧版本的静默影响
      if (snoozed && snoozed.worker === worker && Date.now() < snoozed.until) return
      toastIdRef.current = toast('发现新版本', {
        description: '更新后页面会自动刷新，未提交的表单内容不会保留。',
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: '立即更新',
          onClick: () => {
            acceptedRef.current = true
            toastIdRef.current = null
            serwist.messageSkipWaiting()
          },
        },
        cancel: {
          label: '稍后',
          onClick: () => {
            snoozedRef.current = { worker, until: Date.now() + SNOOZE_DURATION }
            toastIdRef.current = null
          },
        },
        // 用户点右上角关闭时 ref 不会自己归零，不重置就再也弹不出来了
        onDismiss: () => {
          toastIdRef.current = null
        },
        onAutoClose: () => {
          toastIdRef.current = null
        },
      })
    }

    /** 新装好的 worker 停在 waiting 上，就说明有版本可以更新。 */
    const watchWorker = (worker: ServiceWorker | null) => {
      if (!worker) return
      const onStateChange = () => {
        if (worker.state !== 'installed') return
        worker.removeEventListener('statechange', onStateChange)
        // installed 之后浏览器才把 registration.waiting 指过来，稍等一下再确认
        window.setTimeout(() => {
          if (!disposed && registration?.waiting === worker) promptForUpdate(worker)
        }, 200)
      }
      worker.addEventListener('statechange', onStateChange)
    }

    const checkForUpdate = async ({ force = false } = {}) => {
      const now = Date.now()
      if (disposed || !navigator.onLine) return
      if (!force && now - lastCheckAt < MIN_CHECK_INTERVAL) return
      lastCheckAt = now
      try {
        const target = registration ?? (await resolveRegistration())
        if (!target || disposed) return
        await target.update()
        // update() 只保证「检查过了」，安装可能还在进行；
        // 已经停在 waiting 的（上次会话遗留、或检查前就已存在）在这里补一次。
        if (target.waiting) promptForUpdate(target.waiting)
      } catch {
        // 检查失败（离线、边缘节点抖动）不打扰用户，下一次触发会重试
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void checkForUpdate()
    }

    const handleOnline = () => {
      void checkForUpdate({ force: true })
    }

    const handleControllerChange = () => {
      if (acceptedRef.current) window.location.reload()
    }

    const handleUpdateFound = () => {
      watchWorker(registration?.installing ?? null)
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('online', handleOnline)

    void (async () => {
      registration = await resolveRegistration()
      if (disposed || !registration) return
      registration.addEventListener('updatefound', handleUpdateFound)
      // 挂载时可能已经有停在 waiting 的版本（上个会话遗留），也可能正在装新版本
      if (registration.waiting) promptForUpdate(registration.waiting)
      watchWorker(registration.installing)
      await checkForUpdate({ force: true })
      timer = window.setInterval(() => {
        if (document.visibilityState === 'visible') void checkForUpdate()
      }, UPDATE_CHECK_INTERVAL)
    })()

    return () => {
      disposed = true
      if (timer !== undefined) window.clearInterval(timer)
      registration?.removeEventListener('updatefound', handleUpdateFound)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('online', handleOnline)
    }
  }, [serwist])

  return null
}
