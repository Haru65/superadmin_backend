import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const files = []
const collect = (directory) => {
  readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) collect(path)
    else if (entry.name.endsWith('.js')) files.push(path)
  })
}

collect('src')
files.forEach((file) => execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' }))
console.log(`[CHECK] Syntax verified for ${files.length} source files`)
