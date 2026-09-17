'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * 路由切换时的入场动效。
 *
 * 只做「进入」不做「退出」：App Router 的 layout 常驻，做退出动画需要
 * 把旧页面留在 DOM 里，容易出现闪屏和焦点错位。这里用 key 触发重挂载，
 * 每次换页播一段 200ms 的位移淡入，成本低且不会阻塞导航。
 * 系统开启「减弱动态效果」时，MotionConfig(reducedMotion="user") 会自动跳过位移。
 */
export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
