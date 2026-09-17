import { Database, Ellipsis, House, ListChecks, SlidersHorizontal, type LucideIcon } from 'lucide-react'

export interface NavItem {
  /** App Router 路径，必须与应用内路由一致。 */
  href: string
  label: string
  description: string
  icon: LucideIcon
  /** 命中这些前缀时该标签保持高亮。 */
  match: string[]
}

/** 侧边栏主导航。桌面应用里导航常驻，不需要折叠成抽屉。 */
export const navItems: NavItem[] = [
  {
    href: '/',
    label: '概览',
    description: '模板信息与安装入口',
    icon: House,
    match: ['/'],
  },
  {
    href: '/list',
    label: '列表',
    description: '静态数据、筛选与骨架屏',
    icon: ListChecks,
    match: ['/list'],
  },
  {
    href: '/form',
    label: '表单',
    description: '受控组件与校验',
    icon: SlidersHorizontal,
    match: ['/form'],
  },
  {
    href: '/data',
    label: '数据',
    description: '数据层与刷新状态',
    icon: Database,
    match: ['/data'],
  },
  {
    href: '/more',
    label: '更多',
    description: '主题、安装与关于',
    icon: Ellipsis,
    match: ['/more'],
  },
]

/** 判断某个导航项在当前路径下是否处于激活态。 */
export function isNavItemActive(item: NavItem, pathname: string) {
  return item.match.some((prefix) =>
    prefix === '/' ? pathname === '/' : pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** 找出当前路径对应的导航项，供顶部工具条的面包屑使用。 */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return navItems.find((item) => isNavItemActive(item, pathname))
}
