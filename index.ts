import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import getCacheKeyFunction from '@jest/create-cache-key-function'
import type { Transformer } from '@jest/transform'
import { transformSync, transform, Options } from '@swc/core'

function createTransformer(swcTransformOpts?: Options): Transformer {
  const computedSwcOptions = buildSwcTransformOpts(swcTransformOpts)

  return {
    process(src, filename, jestOptions) {
      set(computedSwcOptions, 'module.type', jestOptions.supportsStaticESM ? 'es6' : 'commonjs')

      if (!computedSwcOptions.sourceMaps) {
        set(computedSwcOptions, 'sourceMaps', 'inline')
      }

      return transformSync(src, { ...computedSwcOptions, filename })
    },
    processAsync(src, filename) {
      // async transform is always ESM
      set(computedSwcOptions, 'module.type', 'es6')

      if (!computedSwcOptions.sourceMaps) {
        set(computedSwcOptions, 'sourceMaps', 'inline')
      }

      return transform(src, { ...computedSwcOptions, filename })
    },

    // @ts-expect-error - type overload is confused
    getCacheKey: getCacheKeyFunction([], [JSON.stringify(computedSwcOptions)])
  }
}

export = { createTransformer };

function getOptionsFromSwrc(): Options {
  const swcrc = path.join(process.cwd(), '.swcrc')
  if (fs.existsSync(swcrc)) {
    return JSON.parse(fs.readFileSync(swcrc, 'utf-8')) as Options
  }
  return {}
}

const nodeTargetDefaults = new Map([
  ['12', 'es2018'],
  ['13', 'es2019'],
  ['14', 'es2020'],
  ['15', 'es2021'],
  ['16', 'es2021'],
  ['17', 'es2022'],
])

function buildSwcTransformOpts(swcOptions: Options | undefined): Options {
  const computedSwcOptions = swcOptions || getOptionsFromSwrc()

  if (!computedSwcOptions.jsc?.target) {
    set(
      computedSwcOptions,
      'jsc.target',
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nodeTargetDefaults.get(process.version.match(/v(\d+)/)![1]) || 'es2018'
    )
  }

  set(computedSwcOptions, 'jsc.transform.hidden.jest', true)

  return computedSwcOptions
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
