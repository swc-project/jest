# @swc/jest

[swc][] binding for the jest

## Installation

```sh
# if you use npm
npm i -D jest @swc/jest
# if you use yarn
yarn add jest @swc/jest
```

## Usage

`jest.config.js`:
```
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
}
```

## License

MIT

[swc]: https://swc-project.github.io/
