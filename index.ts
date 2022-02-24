import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import * as vm from 'vm'
import getCacheKeyFunction from '@jest/create-cache-key-function'
import { transformSync, Options } from '@swc/core'

interface JestConfig {
  transform: [match: string, transformerPath: string, options: Options][];
  extensionsToTreatAsEsm?: string[]
}

interface JestTransformerOption {
  config: JestConfig;
  transformerConfig: Options;
}

/**
 * Loads closest package.json in the directory hierarchy
 */
function loadClosestPackageJson(attempts = 1): Record<string, unknown> {
  if (attempts > 5) {
    throw new Error('Can\'t resolve main package.json file')
  }
  const mainPath = attempts === 1 ? './' : Array(attempts).join('../')
  try {
    return require(path.join(process.cwd(), mainPath, 'package.json'))
  } catch (e) {
    return loadClosestPackageJson(attempts + 1)
  }
}

const packageConfig = loadClosestPackageJson()
const isEsmProject = packageConfig.type === 'module'

// Jest use the `vm` [Module API](https://nodejs.org/api/vm.html#vm_class_vm_module) for ESM.
// see https://github.com/facebook/jest/issues/9430
const supportsEsm = 'Module' in vm

function createTransformer(swcTransformOpts?: Options) {
  const computedSwcOptions = buildSwcTransformOpts(swcTransformOpts)

  return {
    process(src: string, filename: string, jestOptions: any) {
      if (supportsEsm) {
        set(computedSwcOptions, 'module.type', isEsm(filename, jestOptions) ? 'es6' : 'commonjs')
      }

      if (!computedSwcOptions.sourceMaps) {
        set(computedSwcOptions, 'sourceMaps', 'inline')
      }

      return transformSync(src, { ...computedSwcOptions, filename })
    },

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
]);

function buildSwcTransformOpts(swcOptions: Options | undefined): Options {
  const computedSwcOptions = swcOptions || getOptionsFromSwrc()

  if (!supportsEsm) {
    set(computedSwcOptions, 'module.type', 'commonjs')
  }

  if (!computedSwcOptions.jsc?.target) {
    set(
      computedSwcOptions,
      'jsc.target',
      nodeTargetDefaults.get(process.version.match(/v(\d+)/)![1]) || 'es2018'
    )
  }

  set(computedSwcOptions, 'jsc.transform.hidden.jest', true)

  return computedSwcOptions
}

function getJestConfig(jestConfig: JestConfig | JestTransformerOption) {
  return 'config' in jestConfig
    // jest 27
    ? jestConfig.config
    // jest 26
    : jestConfig
}

function isEsm(filename: string, jestOptions: any) {
  return (/\.jsx?$/.test(filename) && isEsmProject) ||
    getJestConfig(jestOptions).extensionsToTreatAsEsm?.find((ext: string) => filename.endsWith(ext))
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
