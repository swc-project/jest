import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'
import * as process from 'process'
import getCacheKeyFunction from '@jest/create-cache-key-function'
import type { Transformer, TransformOptions } from '@jest/transform'
import { parse as parseJsonC, type ParseError } from 'jsonc-parser'
import { transformSync, transform, Options, version as swcVersion } from '@swc/core'
import { version } from './package.json'

function createTransformer(swcTransformOpts?: Options & {
  experimental?: {
    customCoverageInstrumentation?: {
      enabled: boolean
      coverageVariable?: string,
      compact?: boolean,
      reportLogic?: boolean,
      ignoreClassMethods?: Array<string>,
      instrumentLog?: { level: string, enableTrace: boolean }
    }
  }
}): Transformer {
  const computedSwcOptions = buildSwcTransformOpts(swcTransformOpts)

  const cacheKeyFunction = getCacheKeyFunction([], [swcVersion, version, JSON.stringify(computedSwcOptions)])
  const { enabled: canInstrument, ...instrumentOptions } = swcTransformOpts?.experimental?.customCoverageInstrumentation ?? {}
  return {
    canInstrument: !!canInstrument, // Tell jest we'll instrument by our own
    process(src, filename, jestOptions) {
      // Determine if we actually instrument codes if jest runs with --coverage
      insertInstrumentationOptions(jestOptions, !!canInstrument, computedSwcOptions, instrumentOptions)

      return transformSync(src, {
        ...computedSwcOptions,
        module: {
          ...computedSwcOptions.module,
          type: (jestOptions.supportsStaticESM ? 'es6' : 'commonjs' as any)
        },
        filename
      })
    },
    processAsync(src, filename, jestOptions) {
      insertInstrumentationOptions(jestOptions, !!canInstrument, computedSwcOptions, instrumentOptions)

      return transform(src, {
        ...computedSwcOptions,
        module: {
          ...computedSwcOptions.module,
          // async transform is always ESM
          type: ('es6' as any)
        },
        filename
      })
    },

    getCacheKey(src, filename, ...rest) {
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
    const errors = [] as ParseError[]
    const options = parseJsonC(fs.readFileSync(swcrc, 'utf-8'), errors)

    if (errors.length > 0) {
      throw new Error(`Error parsing ${swcrc}: ${errors.join(', ')}`)
    }

    return options as Options
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
  ['18', 'es2023'],
  ['19', 'es2023'],
  ['20', 'es2023'],
])

function buildSwcTransformOpts(swcOptions: (Options & { experimental?: unknown }) | undefined): Options {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { experimental, ...computedSwcOptions } = swcOptions || (getOptionsFromSwrc() as Options & { experimental?: unknown })

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

function insertInstrumentationOptions(jestOptions: TransformOptions<unknown>, canInstrument: boolean, swcTransformOpts: Options, instrumentOptions?: any) {
  const shouldInstrument = jestOptions.instrument && canInstrument

  if (!shouldInstrument) {
    return swcTransformOpts
  }

  if (swcTransformOpts?.jsc?.experimental?.plugins?.some((x) => x[0] === 'swc-plugin-coverage-instrument')) {
    return
  }

  if (!swcTransformOpts.jsc) {
    swcTransformOpts.jsc = {}
  }

  if (!swcTransformOpts.jsc.experimental) {
    swcTransformOpts.jsc.experimental = {}
  }

  if (!Array.isArray(swcTransformOpts.jsc.experimental.plugins)) {
    swcTransformOpts.jsc.experimental.plugins = []
  }

  swcTransformOpts.jsc.experimental.plugins?.push(['swc-plugin-coverage-instrument', instrumentOptions ?? {}])
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
