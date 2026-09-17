#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const templateUrl = 'https://github.com/lxchinesszz/web-pwa-next-starter.git'
const valueOptions = new Set([
  'name', 'short-name', 'slug', 'description', 'theme-color',
  'background-color', 'footer-note', 'dir',
])

function parseArguments(args) {
  const options = {}

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--help' || argument === '-h') {
      options.help = true
      continue
    }
    const key = argument.slice(2)
    if (!argument.startsWith('--') || !valueOptions.has(key)) {
      throw new Error(`无法识别参数：${argument}`)
    }
    const value = args[index + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`参数 ${argument} 缺少值`)
    }
    if (options[key]) {
      throw new Error(`参数 ${argument} 重复`)
    }
    options[key] = value
    index += 1
  }

  return options
}

function printHelp() {
  console.log(`从 GitHub 模板创建独立的 PWA 应用

用法：
  create-pwa-app --name "旅行规划助手" --slug trip-planner --description "使用 AI 快速生成旅行计划"

必填参数：
  --name              应用完整名称
  --slug              URL 与部署目录，使用 kebab-case
  --description       应用描述

可选参数：
  --short-name        安装后显示的短名称，默认与 name 相同
  --theme-color       主题色，默认 #863bff
  --background-color  启动画面背景色，默认 #ffffff
  --footer-note       页脚说明，默认 PWA 应用
  --dir               新应用目录，默认当前目录下的 slug
  --help, -h          显示帮助

命令会克隆 ${templateUrl}，初始化配置，安装依赖，生成 PWA 图标，并运行 lint 和 build。`)
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) {
    throw new Error(`无法运行 ${command}：${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} 执行失败（退出码 ${result.status ?? '未知'}）`)
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  for (const key of ['name', 'slug', 'description']) {
    if (!options[key]?.trim()) {
      throw new Error(`缺少必填参数：--${key}`)
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) {
    throw new Error('--slug 必须使用 kebab-case，例如 trip-planner')
  }
  for (const key of ['theme-color', 'background-color']) {
    if (options[key] && !/^#[0-9a-f]{6}$/i.test(options[key])) {
      throw new Error(`--${key} 必须是六位十六进制颜色，例如 #863bff`)
    }
  }

  const target = path.resolve(options.dir || options.slug)
  if (existsSync(path.join(process.cwd(), 'app.config.ts')) &&
      existsSync(path.join(process.cwd(), 'scripts/init-app.mjs'))) {
    throw new Error('请在应用目录之外运行此命令，避免在应用中创建另一个应用')
  }
  if (existsSync(target)) {
    throw new Error(`目标目录已存在，不会覆盖：${target}`)
  }

  run('git', ['clone', '--depth', '1', templateUrl, target], process.cwd())
  await rm(path.join(target, '.git'), { recursive: true, force: true })

  const initArgs = ['scripts/init-app.mjs']
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'dir') {
      initArgs.push(`--${key}`, value)
    }
  }
  run(process.execPath, initArgs, target)
  run('pnpm', ['install'], target)
  run('pnpm', ['generate:pwa-assets'], target)
  run('pnpm', ['lint'], target)
  run('pnpm', ['build'], target)

  console.log(`\n应用已创建：${target}`)
  console.log(`运行：cd ${JSON.stringify(target)} && pnpm dev`)
  console.log('发布前请替换 public/favicon.svg，并重新运行 pnpm generate:pwa-assets。')
}

main().catch((error) => {
  console.error(`创建失败：${error.message}`)
  process.exitCode = 1
})
