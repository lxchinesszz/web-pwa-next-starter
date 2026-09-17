import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const targets = ['.next', 'out', 'node_modules/.cache', 'tsconfig.tsbuildinfo']

for (const target of targets) {
  const absolute = path.join(appRoot, target)
  await rm(absolute, { recursive: true, force: true })
  console.log(`已删除 ${target}`)
}

console.log('清理完成。node_modules 与 Service Worker 产物均已移除，重新 pnpm build 即可重建。')
