import {withSerwist} from '@serwist/turbopack'
import type {NextConfig} from 'next'
import {appConfig} from '@app-config'
import packageJson from './package.json'

// Turbopack 下服务端组件无法直接读 package.json，构建期通过 env 内联这两个值。

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    // 空字符串表示部署在域名根路径；填 '/my-app' 即可挂到子目录。
    basePath: appConfig.basePath || undefined,
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
        NEXT_PUBLIC_BASE_PATH: appConfig.basePath,
    },
    experimental: {
        // 这一步会告诉 Next.js 静态导出时不要为每个页面生成 RSC Payload (.txt) 文件
        clientRouterFilter: true,
        // 模板体积优先，默认导入的图标按需打包。
        optimizePackageImports: ['lucide-react', 'motion'],
    },
}
// withSerwist 会把 esbuild / esbuild-wasm 标记为服务端外部依赖，
// `/serwist/sw.js` 路由需要在构建期用它们打包 Service Worker。
export default withSerwist(nextConfig)
