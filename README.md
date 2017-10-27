[![npm](https://img.shields.io/npm/v/import-codemod.svg)](https://www.npmjs.com/package/import-codemod)
[![Travis](https://travis-ci.org/jongold/import-codemod.svg?branch=master)](https://travis-ci.org/jongold/import-codemod)

# import-codemod

Flexible codemod for moving around imports.

It's super useful for migrating giant codebases to [`react-primitives`](https://github.com/lelandrichardson/react-primitives/). It might be useful for some other things.

## Usage
Create a config file (or use the included `src/configs/config.primitives.js`)
```bash
yarn global add jscodeshift
yarn add import-codemod

jscodeshift <path> -t ./node_modules/import-codemod/lib/index.js --config path-to-config.js
```

## Things it can do 

### Move select named imports from one module to another
```js
import { Text, View } from 'react-native';
// ->
import { Text, View } from 'react-primitives';
```

`config.js`
```js
module.exports = {
  mappings: [
    module: {
      from: 'react-native',
      to: 'react-primitives',
    },
    specifiers: [
      'Text',
      'View',
    ],
  },
}
```

### Move all named imports from one module to another
```js
import { Text, View, lots, of, others } from 'react-native';
// ->
import { Text, View, lots, of, others } from 'react-primitives';
```

`config.js`
```js
module.exports = {
  mappings: [
    module: {
      from: 'react-native',
      to: 'react-primitives',
    },
    specifiers: [
      '*',
    ],
  ],
}
```

### Move and rename named imports from one module to another
```js
import { Text, View } from 'react-native';
// ->
import { Words, Box } from 'react-primitives';
```

`config.js`
```js
module.exports = {
  mappings: [
    module: {
      from: 'react-native',
      to: 'react-primitives',
    },
    specifiers: {
      'Text': 'Words',
      'View': 'Box',
    },
  ],
}
```

### Move default imports from one module to another
```js
import Foo from 'foo';
// ->
import Foo from 'bar';
```

`config.js`
```js
module.exports = {
  mappings: [
    module: {
      from: 'react-native',
      to: 'react-primitives',
    },
    specifiers: ['default'],
  ],
}
```

### Move default imports from one module to named imports of another
```js
import Foo from 'foo';
// ->
import { Foo } from 'bar';
```

`config.js`
```js
module.exports = {
  mappings: [
    module: {
      from: 'react-native',
      to: 'react-primitives',
    },
    specifiers: {
      'default': 'Foo'
    },
  ],
}
```

## Exclude files from being transformed
```js
// @ignoreMe
…
```
`config.js`
```js
module.exports = {
  ignoreMark: '@ignoreMe',
  mappings: [],
}
```