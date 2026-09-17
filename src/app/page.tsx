import { OverviewView } from '@/components/views/overview-view'

/**
 * 首页不覆盖 title：`title.template` 只作用于子路由段，与 layout 同段的页面
 * 会落到 layout 的 `title.default`（即应用全名）。加了 title 反而会丢掉应用名。
 */

export default function HomePage() {
  return <OverviewView />
}
