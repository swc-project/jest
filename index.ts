import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'
import * as process from 'process'
import getCacheKeyFunction from '@jest/create-cache-key-function'
import type { Transformer, TransformOptions } from '@jest/transform'
import { transformSync, transform, Options } from '@swc/core'

function createTransformer(swcTransformOpts?: Options): Transformer {
  const computedSwcOptions = buildSwcTransformOpts(swcTransformOpts)

  const cacheKeyFunction = getCacheKeyFunction([], [JSON.stringify(computedSwcOptions)])

  return {
    process(src, filename, jestOptions) {
      set(computedSwcOptions, 'module.type', jestOptions.supportsStaticESM ? 'es6' : 'commonjs')

      return transformSync(src, {
        ...computedSwcOptions,
        module: {
          ...computedSwcOptions.module,
          type: jestOptions.supportsStaticESM ? 'es6' : 'commonjs'
        },
        filename
      })
    },
    processAsync(src, filename) {
      return transform(src, {
        ...computedSwcOptions,
        module: {
          ...computedSwcOptions.module,
          // async transform is always ESM
          type: 'es6'
        },
        filename
      })
    },

    getCacheKey(src, filename, ...rest){
      // @ts-expect-error - type overload is confused
      const baseCacheKey = cacheKeyFunction(src, filename, ...rest)

      // @ts-expect-error - signature mismatch between Jest <27 og >=27
      const options: TransformOptions = typeof rest[0] === 'string' ? rest[1] : rest[0]

      return crypto
        .createHash('md5')
        .update(baseCacheKey)
        .update('\0', 'utf8')
        .update(JSON.stringify({ supportsStaticESM: options.supportsStaticESM }))
        .digest('hex')
    }
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

  if (!computedSwcOptions.sourceMaps) {
    set(computedSwcOptions, 'sourceMaps', 'inline')
  }

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
