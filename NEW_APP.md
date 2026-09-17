# 使用模板创建新应用

本文档供开发者和 AI Agent 使用。一个应用一个独立目录，并在该目录内完成初始化；不要在一个应用目录里再生成另一个应用。

## 创建流程

1. 把本模板复制到新应用目录，复制时排除 `.git/`、`node_modules/`、`.next/`、`out/`、`pnpm-lock.yaml` 之外的构建产物与编辑器临时文件：

   ```bash
   rsync -a --exclude '.git' --exclude 'node_modules' --exclude '.next' --exclude 'out' \
     web-pwa-next-starter/ ../my-new-app/
   ```

2. 进入新应用目录，运行初始化命令：

   ```bash
   node scripts/init-app.mjs \
     --name "web-pwa-next演示网" \
     --short-name "web-pwa-next演示网" \
     --slug "web-pwa-next-starter" \
     --description "使用 AI 快速生成旅行计划" \
     --theme-color "#863bff"
   ```

   该命令只做两件事：重写 `app.config.ts`、把 `package.json` 的 name 改成 slug、version 重置为 `0.1.0`。
   应用名称、主题色、PWA manifest、页面标题全部从 `app.config.ts` 派生，不需要改别的地方。

3. `pnpm install`。模板通过 `pnpm-workspace.yaml` 把依赖放在 `~/.pnpm-store`，同机多个应用共享，不会重复下载。

4. 替换 `public/favicon.svg`，然后运行 `pnpm generate:pwa-assets` 重新生成全平台图标。

5. 替换 `public/data/` 下的示例数据，或按 `AGENTS.md` 的「数据层约束」新增数据集。

6. 改 `src/components/views/` 下的视图，必要时在 `src/lib/nav.ts` 调整侧边栏导航。

7. 运行 `pnpm lint && pnpm typecheck && pnpm build`，再用 `pnpm start` 手工验证 PWA。

## AI Agent 约束

- 动手前先读 `AGENTS.md`、`NEW_APP.md`、`app.config.ts`。
- 应用名称、短名称、描述、slug、语言、主题色、basePath、页脚**只在 `app.config.ts` 维护**，
  不要在页面、`layout.tsx`、`manifest.ts` 或 `next.config.ts` 里重复写死。
- 保留现有的 PWA 安装、离线兜底、版本显示与手动更新能力。
- 保留 `src/app/serwist/[path]/route.ts` 与 `src/sw.ts` 的路径约定，`src/lib/pwa.ts` 依赖它们。
- 新增页面时：`src/app/<route>/page.tsx` 只导出 metadata 并渲染视图，
  交互逻辑放在 `src/components/views/<name>-view.tsx`（`'use client'`）。
- 新应用版本从 `0.1.0` 开始。
- 未经用户允许，不要执行部署、删除目录或覆盖已存在的其他应用。

## 部署形态

模板默认部署在**域名根路径**，由 Node 运行（`pnpm build && pnpm start`）。

- 需要挂到子目录：把 `app.config.ts` 的 `basePath` 改成 `'/my-app'`，manifest 的 scope、start_url、
  图标路径、SW 注册路径与数据请求前缀会自动跟随。
- 需要纯静态托管：在 `next.config.ts` 加 `output: 'export'` 与 `images: { unoptimized: true }`，
  构建后上传 `out/` 目录即可（详见 `README.md` 的部署章节）。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
pnpm clean
pnpm generate:pwa-assets
```

`pnpm build` 会同时产出 Service Worker；没有跑过 build 就没有 `/serwist/sw.js`，
PWA 相关能力在开发服务器上只有部分可用（注册得到，但预缓存清单为空）。
