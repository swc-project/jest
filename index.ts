import * as fs from 'fs'
import * as path from 'path'
import { transformSync, Options } from '@swc/core'

interface JestConfig26 {
  transform: [match: string, transformerPath: string, options: Options][];
}

interface JestConfig27 {
  transformerConfig: Options;
}

let transformOpts: Options

function getJestTransformConfig(
  jestConfig: JestConfig26 | JestConfig27
): Options | undefined {
  if ("transformerConfig" in jestConfig) {
    // jest 27
    return jestConfig.transformerConfig;
  }

  if ("transform" in jestConfig) {
    // jest 26
    return (
      jestConfig.transform.find(
        ([, transformerPath]) => transformerPath === __filename
      )?.[2]
    );
  }
}

export = {
  process(src: string, filename: string, jestConfig: any) {

    if (/\.(t|j)sx?$/.test(filename)) {

      if (!transformOpts) {
        let swcOptions = getJestTransformConfig(jestConfig);

        if (!swcOptions) {
          const swcrc = path.join(process.cwd(), '.swcrc')
          swcOptions = fs.existsSync(swcrc) ? JSON.parse(fs.readFileSync(swcrc, 'utf-8')) as Options : {}
        }

        // set(swcOptions, 'module.type', 'commonjs')
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
