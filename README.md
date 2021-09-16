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

```
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
}
```

It will load swc configuration from `.swcrc` in default. You also can custom it:

```
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {/* you swc configuration */}],
  },
}
```

## License

MIT

[swc]: https://swc.rs
