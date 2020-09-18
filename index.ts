import { transformSync } from '@swc/core'

export = {
  process(src: string, path: string, jestConfig: any) {
    const [, , transformOptions = {}] =
      (jestConfig.transform || []).find(([, transformerPath]: [string, string]) => transformerPath === __filename) || []

    if (/\.(t|j)sx?$/.test(path)) {
      return transformSync(src, {
        filename: path,
        jsc: {
          transform: {
            //@ts-expect-error
            hidden: {
              jest: true
            }
          },
        },
        module: {
          type: "commonjs"
        }
      })
    }
    return src
  },
}