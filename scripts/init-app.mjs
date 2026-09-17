import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArguments(args) {
  const options = {}

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]

    if (argument === '--help' || argument === '-h') {
      options.help = true
      continue
    }

    if (!argument.startsWith('--')) {
      throw new Error(`无法识别参数：${argument}`)
    }

    const key = argument.slice(2)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`参数 ${argument} 缺少值`)
    }

    options[key] = value
    index += 1
  }

  return options
}

function printHelp() {
  console.log(`初始化当前目录中的 Next.js PWA 应用

用法：
  node scripts/init-app.mjs --name "旅行规划助手" --short-name "旅行助手" --slug "trip-planner" --description "使用 AI 快速生成旅行计划"

必填参数：
  --name              应用完整名称
  --slug             kebab-case 标识，写入 package.json 与 PWA manifest 的 id
  --description       应用描述

可选参数：
  --short-name        安装后显示的短名称，默认与 name 相同
  --theme-color       主题色，默认 #863bff
  --background-color  启动画面背景色，默认 #ffffff
  --base-path         部署前缀，默认根路径；例如 --base-path /trip-planner
  --footer-note       页脚说明，默认「Next.js PWA 应用」`)
}

function validateOptions(options) {
  const required = ['name', 'slug', 'description']
  const missing = required.filter((key) => !options[key]?.trim())

  if (missing.length > 0) {
    throw new Error(`缺少必填参数：${missing.map((key) => `--${key}`).join('、')}`)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) {
    throw new Error('--slug 必须使用 kebab-case，例如 trip-planner')
  }

  for (const key of ['theme-color', 'background-color']) {
    if (options[key] && !/^#[0-9a-f]{6}$/i.test(options[key])) {
      throw new Error(`--${key} 必须是六位十六进制颜色，例如 #863bff`)
    }
  }

  if (options['base-path'] && !/^\/[a-z0-9-]*$/i.test(options['base-path'])) {
    throw new Error('--base-path 必须以 / 开头，例如 /trip-planner；根路径请省略该参数')
  }
}

async function updatePackageFile(slug) {
  const file = path.join(appRoot, 'package.json')
  const packageJson = JSON.parse(await readFile(file, 'utf8'))
  packageJson.name = slug
  packageJson.version = '0.1.0'
  await writeFile(file, `${JSON.stringify(packageJson, null, 2)}\n`)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))

  if (options.help) {
    printHelp()
    return
  }

  validateOptions(options)

  const config = {
    name: options.name.trim(),
    shortName: (options['short-name'] || options.name).trim(),
    description: options.description.trim(),
    slug: options.slug,
    lang: 'zh-CN',
    themeColor: options['theme-color'] || '#863bff',
    backgroundColor: options['background-color'] || '#ffffff',
    basePath: `/${options.slug || ''}`,
    footerNote: options['footer-note'] || 'Next.js PWA 应用',
  }

  const configSource = `/**
 * 应用元数据的唯一来源。
 *
 * 由 scripts/init-app.mjs 生成，也可以手工修改。
 * 这里的字段会被 next.config.ts、src/app/layout.tsx、src/app/manifest.ts 读取，
 * 不要在页面里重复写死。
 */
export const appConfig = ${JSON.stringify(config, null, 2)} as const

export type AppConfig = typeof appConfig
`

  await writeFile(path.join(appRoot, 'app.config.ts'), configSource)
  await updatePackageFile(config.slug)

  console.log(`已初始化 ${config.name}`)
  console.log(`目录：${appRoot}`)
  console.log(`访问路径：${config.basePath || ''}/`)
  console.log('下一步：')
  console.log('  1. 替换 public/favicon.svg 后执行 pnpm generate:pwa-assets')
  console.log('  2. 按需替换 public/data/ 下的示例数据')
  console.log('  3. pnpm install && pnpm lint && pnpm build')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
