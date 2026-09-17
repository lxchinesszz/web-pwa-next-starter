<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

## 开始前必读

1. 先读 `app.config.ts`、`NEW_APP.md` 和本文件，再动代码。
2. Next.js 16 的约定与训练数据可能不同，写代码前先查 `node_modules/next/dist/docs/01-app/`。
3. 这个目录是**模板**。不要在这里直接开发具体业务应用，先按 `NEW_APP.md` 复制出独立目录。

## Project Structure & Module Organization

Next.js 16 App Router + TypeScript 项目。

- `app.config.ts`：应用元数据唯一来源（名称、slug、主题色、basePath、页脚）。
- `src/app/`：路由。`layout.tsx` 组装外壳，`manifest.ts` 生成 PWA manifest，
  `serwist/[path]/route.ts` 在构建期产出 Service Worker，`sw.ts`（在 `src/` 根）是 SW 源码。
- `src/components/ui/`：shadcn/ui 组件源码，按官方实现 vendored 进来，可直接改。
- `src/components/views/`：页面级视图，全部是客户端组件；对应的 `page.tsx` 只负责导出 metadata。
- `src/components/pwa/`：Service Worker 注册、更新提示、安装引导、离线提示。
- `src/lib/`：`nav.ts` 导航表、`pwa.ts` PWA 路径常量、`version.ts` 版本与 basePath、`data/` 数据层。
- `src/hooks/`：通用 hook。
- `public/data/`：静态数据集（JSON），构建后原样发布。
- `public/` 下的图标由 `pnpm generate:pwa-assets` 从 `public/favicon.svg` 生成。

## 布局与导航约定

这是**桌面 Web 应用**模板（PC 浏览器优先），不是移动端应用。不要引入底部标签栏、手机壳限宽、
安全区 padding 这类移动端形态。

- 外壳固定为「左侧导航 + 顶部工具条 + 内容区」，组装在 `src/components/app-shell.tsx`。
- `AppSidebar` 在 `lg` 及以上展开 240px，更窄自动收成 64px 图标栏，**始终可见**，不要改成抽屉。
- 工具条只放跨页面通用能力（面包屑、网络状态、安装、主题）；页面标题与页面级操作放页面内的
  `PageHeader`。
- 新增导航项只改 `src/lib/nav.ts` 的 `navItems`，侧边栏与面包屑会同时生效。
- 断点习惯：`sm` 两列、`lg` 左右分栏、`xl` 三到四列；表格用 `src/components/ui/table.tsx`。
- 内容区已有 `max-w-[1440px]` 限宽，页面里不要再套一层限宽容器。

## Build, Test, and Development Commands

```bash
pnpm install              # 依赖安装（store 固定在 ~/.pnpm-store）
pnpm dev                  # 开发服务器，SW 会在源码变化时重新构建
pnpm lint                 # ESLint（含 react-hooks / React Compiler 规则）
pnpm typecheck            # tsc --noEmit
pnpm build                # 生产构建，同时生成 /serwist/sw.js
pnpm start                # 本地跑生产构建
pnpm clean                # 删除 .next / out / 缓存
pnpm generate:pwa-assets  # 从 favicon.svg 重新生成全平台图标
pnpm init-app --help      # 用参数重写 app.config.ts 与 package.json
```

提交前必须跑通 `pnpm lint && pnpm typecheck && pnpm build`。

## Coding Style & Naming Conventions

- 两空格缩进、单引号、**不写分号**、多行结构保留尾逗号（Prettier 风格，但仓库未装 Prettier，靠约定维持）。
- 组件文件 PascalCase（`app-shell.tsx` 用 kebab-case，与 shadcn 保持一致），
  导出组件名 PascalCase，变量与函数 camelCase。
- 注释只写「为什么」，不写「做了什么」。涉及库的特殊行为、平台坑、性能取舍时必须写清原因。
- 类型推导优先：数据结构用 zod 描述一次，类型用 `z.infer` 推导，不要手写重复 interface。

## 状态与副作用约定

ESLint 启用了 React Compiler 的 `react-hooks` 规则，以下写法会直接报错：

- **不要在 effect 里同步 `setState`**。派生状态请在渲染期算出来（参考 `useDataset` 用
  `requestKey` 推导加载态），环境值用 `useSyncExternalStore`（参考 `useNetworkStatus`、
  `useIsStandalone`）。
- **不要在渲染期读写 ref**。把 loader 做成模块级稳定引用传给 hook，而不是用 ref 兜住。
- 需要「客户端挂载后再渲染」时用 `useMounted()`，不要 `useEffect(() => setMounted(true))`。

## 应用元数据规则

- 名称、短名称、描述、主题色、语言、basePath、页脚**只在 `app.config.ts` 中维护**。
- 不要在 `layout.tsx`、`manifest.ts`、页面或 `next.config.ts` 里重复写死这些值。
- `basePath` 为空表示部署在域名根路径；填 `/my-app` 时 manifest 的 `scope`、`start_url`、
  图标路径与数据请求前缀会自动跟随。

## PWA 约束

- Service Worker 由 `/serwist/sw.js` 提供，注册逻辑在 `src/components/pwa/pwa-provider.tsx`。
- `skipWaiting: false` 是有意为之：新版本停在 waiting，由用户点击更新。改动前先确认交互预期。
- 离线兜底页是 `/offline`，通过 `additionalPrecacheEntries` 显式预缓存；改路径要同时改
  `src/app/serwist/[path]/route.ts` 与 `src/sw.ts`。
- `src/sw.ts` 运行在浏览器里，**不能读 `process.env`**；需要构建期常量时通过 route.ts 的
  `esbuildOptions.define` 注入。
- 默认只预缓存 `.next/static/**` 与 `public/**`；新增需要离线可用的资源，确认它落在这两个目录里。

## 数据层约束

- 页面只调用 `src/lib/data/index.ts` 暴露的函数，不要自己 `fetch` 或 import JSON。
- 新增数据集：在 `public/data/` 放 JSON → 在 `schemas.ts` 加 zod schema → 在 `endpoints.ts`
  注册路径 → 在 `index.ts` 加访问函数。
- 接真实接口时只改 `endpoints.ts`（必要时在 `client.ts` 统一加鉴权头），页面零改动。

## Testing Guidelines

仓库当前没有测试框架。改动必须通过 `pnpm lint`、`pnpm typecheck`、`pnpm build`，并在
`pnpm dev` 或 `pnpm start` 中手工验证（重点：侧边栏导航与面包屑、深色模式、断网后刷新、更新提示、窄屏下侧边栏收成图标栏）。
引入测试时优先用 colocated 命名（`list-view.test.tsx`），并把命令补进本文件。

## Commit & Pull Request Guidelines

提交信息用祈使句、单次提交只做一件事，例如 `Add offline fallback page`。
PR 需说明动机与行为变化、列出验证方式；涉及 UI 的附截图，涉及 PWA 缓存的显式说明影响。
