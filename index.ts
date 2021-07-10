import * as fs from 'fs'
import * as path from 'path'
import { transformSync, Options } from '@swc/core'


let transformOpts: Options

export = {
  process(src: string, filename: string, jestConfig: any) {

    if (/\.(t|j)sx?$/.test(filename)) {

      if (!transformOpts) {
        const isSwcJestTransformer = ([, transformerPath]: [unknown, string]) => transformerPath === __filename

        let [, , swcOptions] = (jestConfig.transform || []).find(isSwcJestTransformer) || []

        if (!swcOptions) {
          const swcrc = path.join(process.cwd(), '.swcrc')
          swcOptions = fs.existsSync(swcrc) ? JSON.parse(fs.readFileSync(swcrc, 'utf-8')) : {}
        }

        set(swcOptions, 'module.type', 'commonjs')
        set(swcOptions, 'jsc.transform.hidden.jest', true)

        transformOpts = swcOptions
      }

      return transformSync(src, { ...transformOpts, filename })
    }

    return src
  },
}

function set(obj: any, path: string, value: any) {
  let o = obj
  const parents = path.split('.')
  const key = parents.pop() as string

  for (const prop of parents) {
    if (o[prop] == null) o[prop] = {}
    o = o[prop]
  }

  o[key] = value
}