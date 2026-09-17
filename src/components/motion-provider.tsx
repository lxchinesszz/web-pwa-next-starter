'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * 统一的动效配置。
 *
 * `reducedMotion="user"` 会尊重系统的「减弱动态效果」设置：开启后所有
 * transform / layout 动画自动降级为瞬时切换，无障碍上必须保留这个行为。
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      {children}
    </MotionConfig>
  )
}
