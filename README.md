# @swc/jest

[swc][] binding for the jest

## Installation

```sh
# if you use npm
npm i -D jest @swc/core @swc/jest
# if you use yarn
yarn add -D jest @swc/core @swc/jest
```

## Usage

`jest.config.js`:

```js
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
}
```

It will load swc configuration from `.swcrc` in default. You also can custom it:

```js
const fs = require('fs')

const config = JSON.parse(fs.readFileSync(`${__dirname}/.swcrc`, 'utf-8'))

module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { ...config, /* custom configuration in jest */ }],
  },
}
```

## Q & A

### Q: Jest use CommonJS in default. But I want to use ESM.

A: Setup Jest following this [Guide](https://jestjs.io/docs/ecmascript-modules).

  For JavaScript, it need to configure `package.json`:
  
  ```json
  {
    // ...
    "type": "module"
  }
  ```

  For TypeScript, it need some configuration in `jest.config.js`:

  ```js
  module.exports = {
    // ...
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
  }
  ```

  Run test with `--experimental-vm-modules`:

  ```sh
  cross-env NODE_OPTIONS=--experimental-vm-modules jest

  # or
  node --experimental-vm-modules ./node_modules/jest/bin/jest.js
  ```

### Q: What ECMAScript target is set by `jsc.target`?

A: By default, the version supported by your Node runtime.

| Node version | Default `jsc.target` |
|--------------|----------------------|
| 12           | 'es2018'             |
| 13           | 'es2019'             |
| 14           | 'es2020'             |
| 15           | 'es2021'             |
| 16           | 'es2021'             |
| 17           | 'es2022'             |

You can customize this by setting an explicit version in your config:

```js
module.exports = {
    transform: {
        "^.+\\.(t|j)sx?$": [
            "@swc/jest",
            {
                jsc: {
                    target: "es2021",
                },
            },
        ],
    },
}
```

## License

MIT

[swc]: https://swc.rs
