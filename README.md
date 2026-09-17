# Web PWA Next Starter

**桌面 Web 应用**（PC 浏览器优先）的 PWA 起始模板：**Next.js 16（App Router + Turbopack）+ Tailwind CSS v4 + shadcn/ui + Motion + Serwist + 静态数据层**。

布局是标准的桌面形态：左侧常驻导航 + 顶部工具条 + 宽屏内容区（超宽屏按 1440px 限宽）。目标是把「新建一个桌面 Web 应用」里最费时的部分先做完：应用外壳、设计系统、PWA 安装/离线/更新、数据层接缝，都已经是可运行、可验证的状态，新应用只需要替换 `app.config.ts` 与页面内容。

## 技术选型

| 关注点 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 16.3（App Router） | 默认 Turbopack；页面默认服务端组件 |
| 样式 | Tailwind CSS v4 | 无 `tailwind.config`，主题走 `@theme` + CSS 变量 |
| 组件 | shadcn/ui（new-york） | 组件源码直接放在 `src/components/ui`，可读可改 |
| 动效 | Motion 13 | `motion/react`，尊重系统「减弱动态效果」 |
| PWA | Serwist 9（`@serwist/turbopack`） | 构建期用 esbuild 打包出 `/serwist/sw.js` |
| 数据（前期） | `public/data/*.json` + zod | 通过 `src/lib/data` 统一访问，后期只换一层 |
| 表单 | react-hook-form + zod | 校验规则即类型来源 |
| 主题 | next-themes | 浅色 / 深色 / 跟随系统 |

## 快速开始

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

> Service Worker 只在**生产构建**里带预缓存清单。要在本地验证「安装 / 离线 / 更新」，请用
> `pnpm build && pnpm start`，然后用 `http://localhost:3000` 而不是 IP 访问（`localhost` 才被视为安全上下文）。

## 目录结构

```
app.config.ts                 应用元数据唯一来源
next.config.ts                basePath、env 注入、withSerwist
components.json               shadcn CLI 配置（可继续 pnpm dlx shadcn@latest add xxx）
src/
  app/
    layout.tsx                Provider 组装 + 元数据 + viewport
    manifest.ts               由 app.config.ts 生成 /manifest.webmanifest
    globals.css               Tailwind v4 主题变量、滚动条与选区样式
    sw.ts                     Service Worker 源码（Serwist）
    serwist/[path]/route.ts   构建期产出 /serwist/sw.js
    page.tsx / list / form / data / more / offline
  components/
    app-shell.tsx             左侧导航 + 顶部工具条 + 内容区
    app-sidebar.tsx           主导航（窄屏自动收成图标栏）
    app-toolbar.tsx           面包屑 + 网络状态 + 安装 + 主题
    theme-toggle.tsx page-transition.tsx page-header.tsx
    data-state.tsx            骨架屏 / 错误态 / 空态
    pwa/                      注册、更新提示、安装引导、离线提示
    ui/                       shadcn/ui 组件（30 个）
    views/                    各页面的客户端视图
  hooks/                      useDataset / useNetworkStatus / useMounted ...
  lib/
    data/                     数据层：endpoints → client → schemas
    nav.ts pwa.ts version.ts utils.ts
public/
  data/*.json                 静态数据集
  pwa-*.png 等                由 pnpm generate:pwa-assets 生成
```

## 布局约定

- `AppShell` 负责三件事：左侧 `AppSidebar`（`lg` 及以上展开 240px，更窄收成 64px 图标栏，始终可见）、
  顶部 `AppToolbar`（面包屑 + 全局操作）、内容区（`max-w-[1440px]` 居中限宽）。
- 页面自己的标题与操作按钮写在页面里（`PageHeader`），工具条只放跨页面通用的东西。
- 新增一个导航项：改 `src/lib/nav.ts` 的 `navItems` 即可，侧边栏与工具条面包屑会同时生效。
- 断点习惯：`sm` 起两列、`lg` 起左右分栏、`xl` 起三到四列。表格类内容用 `src/components/ui/table.tsx`。

## PWA 是怎么搭起来的

1. **manifest**：`src/app/manifest.ts` 从 `app.config.ts` 生成 `name/short_name/theme_color/start_url/icons`，
   Next 会自动注入 `<link rel="manifest">`。
2. **Service Worker**：`src/sw.ts` 是源码；`src/app/serwist/[path]/route.ts` 用
   `createSerwistRoute()` 在**构建期**用 esbuild 打包，并把预缓存清单注入 `self.__SW_MANIFEST`，
   最终以静态文件形式产出 `/serwist/sw.js`（运行时零开销）。
   Turbopack 目前没有 webpack 的插件钩子，这是 Serwist 官方给 Next 16 的方案。
3. **预缓存范围**：默认 `.next/static/**` 与 `public/**`（因此 `public/data/*.json` 天然离线可用）；
   App Router 预渲染出的 HTML 不在其中，所以 `/offline` 由 `additionalPrecacheEntries` 显式加入，
   revision 取构建时间，保证发版后会刷新。
4. **更新流程**：`skipWaiting: false`。新版本进入 waiting 状态后弹出提示，用户点「立即更新」
   才 skipWaiting，`controlling` 事件触发页面刷新 —— 不会打断正在填写的表单。
5. **离线兜底**：导航请求失败时回退到预缓存的 `/offline`。
6. **安装引导**：桌面 Chrome / Edge 在满足条件后派发 `beforeinstallprompt`，应用内右下角弹出浮动卡片，
   点「安装」即可以独立窗口装到桌面 / 任务栏；用户点「不再提示」后写入 localStorage。
   manifest 里声明了 `display_override: ['window-controls-overlay', 'standalone']`，支持时窗口标题栏交给页面自适应。

## 数据层：现在与以后

页面只调用 `src/lib/data/index.ts` 里的函数：

```ts
const { data, error, status, isRefreshing, refresh } = useDataset('items', getItems)
```

链条是 `endpoints.ts`（地址）→ `client.ts`（fetch + zod 校验 + 统一错误）→ `index.ts`（对外函数）。
接真实接口时**只改 `endpoints.ts`**：

```ts
export const datasetEndpoints = {
  overview: '/api/v1/overview',
  items: '/api/v1/items',
  activity: '/api/v1/activity',
}
```

需要鉴权头、重试或缓存策略时，统一加在 `client.ts` 的 `requestDataset` 里。
接口返回不符合 schema 会抛 `DatasetError` 并在页面上显示具体字段路径，而不是静默渲染空白。

## 常见任务

```bash
pnpm dev                  # 开发
pnpm lint                 # ESLint（含 React Compiler 规则）
pnpm typecheck            # tsc --noEmit
pnpm build && pnpm start  # 生产构建 + 本地验证 PWA
pnpm clean                # 清理 .next / out / 缓存
pnpm generate:pwa-assets  # 换掉 public/favicon.svg 后重新生成全平台图标
pnpm init-app --help      # 用参数重写 app.config.ts 与 package.json
```

新增一个 shadcn/ui 组件：

```bash
pnpm dlx shadcn@latest add popover
```

（`components.json` 已配好，组件会落到 `src/components/ui`。注意 shadcn CLI 4.x 的交互式选项有变化，
必要时按官方仓库源码手工补齐。）

## 部署

### 部署在域名根路径（默认）

`app.config.ts` 的 `basePath` 留空即可。`pnpm build` 后可以：

- 用 Node 运行：`pnpm build && pnpm start`（默认 3000 端口，可加 `-p`）。
- 部署到支持 Next 的平台（Vercel / 自建 Node 环境）。

### 部署到子目录

把 `app.config.ts` 的 `basePath` 改成 `'/my-app'`。`next.config.ts` 的 `basePath`、manifest 的
`scope`/`start_url`、图标路径、Service Worker 注册路径与数据请求前缀都会自动跟随。

### 部署到纯静态 CDN

模板默认不是静态导出。如果目标环境只能放静态文件（例如对象存储 + CDN），加上静态导出：

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // ...
}
```

`/serwist/sw.js` 是 `force-static` 的路由处理器，会一并导出到 `out/serwist/sw.js`；
把 `out/` 整个目录上传即可。注意静态导出下没有 ISR、Middleware 与图片优化。

## 排障

- **`ERR_PNPM_IGNORED_BUILDS: @swc/core`**：`@swc/core` 是 `@serwist/turbopack` 声明但代码里没有
  用到的依赖，`pnpm-workspace.yaml` 已经把它的构建脚本设为 `false`。不影响构建。
- **没有安装按钮 / 装不上**：`beforeinstallprompt` 只在 `https` 或 `localhost` 下、且 Service Worker
  注册成功后才会派发。开发服务器下 SW 没有预缓存清单，验证安装请用 `pnpm build && pnpm start`。
  条件不满足时工具条会提示「使用地址栏右侧的安装图标」。
- **改了 `src/sw.ts` 但页面没变化**：Service Worker 更新走的是 waiting → 用户确认流程，
  开发时更快的做法是 DevTools → Application → Service Workers → Update on reload。
- **离线页不更新**：确认 `additionalPrecacheEntries` 的 revision 变了（默认取构建时间，每次发版都会变）。
- **想彻底重置本地 PWA 状态**：「更多」页有「清空缓存」按钮，或在 DevTools 里 Unregister。

## 相关文档

- `AGENTS.md`：代码约定与硬性约束（写代码前先读）
- `NEW_APP.md`：如何从本模板派生一个新应用
