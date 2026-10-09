import fs from 'node:fs'
import path from 'node:path'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
const exactPath = (candidate) => {
  const parts = path.relative(process.cwd(), path.resolve(candidate)).split(path.sep)
  let current = process.cwd()
  for (const part of parts) {
    if (!fs.existsSync(current) || !fs.readdirSync(current).includes(part)) return false
    current = path.join(current, part)
  }
  return fs.existsSync(current)
}
let errors = 0
for (const file of walk('src').filter((file) => /\.(js|vue)$/.test(file))) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
    const name = match[1]
    if (!name.startsWith('@/') && !name.startsWith('.')) continue
    const target = name.startsWith('@/') ? path.join('src', name.slice(2)) : path.join(path.dirname(file), name)
    if (![target, target + '.js', target + '.vue', path.join(target, 'index.js')].some(exactPath)) {
      console.error(file + ': import inexistente o con mayúsculas incorrectas: ' + name)
      errors++
    }
  }
  if (file.endsWith('.vue')) {
    try {
      const result = parse(source, { filename: file })
      if (result.errors.length) throw result.errors
      const descriptor = result.descriptor
      if (descriptor.script || descriptor.scriptSetup) compileScript(descriptor, { id: file })
      if (descriptor.template) {
        const compiled = compileTemplate({ source: descriptor.template.content, filename: file, id: file })
        if (compiled.errors.length) throw compiled.errors
      }
    } catch (error) {
      console.error(file, error)
      errors++
    }
  }
}
if (errors) process.exitCode = 1
else console.log('Componentes e imports verificados, incluyendo mayúsculas para Linux.')
