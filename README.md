# primitives-codemods

Turn this:
```js
import { Text, View, Platform, ScrollView } from 'react-native';
```

into this:
```js
import { ScrollView } from 'react-native';
import { Text, Platform, View } from 'react-primitives';
```

```bash
jscodeshift input-file.js -t path-to-primitives-codemods/src/index.js
```