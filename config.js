export default {
  mappings: [
    {
      from: 'react-native',
      to: 'react-primitives',
      modules: [
        'Animated',
        'StyleSheet',
        'View',
        'Text',
        'Image',
        'Touchable',
        'Platform',
      ],
    },
    {
      from: 'react-native',
      to: 'react-native-shared',
      modules: [
        '*',
      ],
    },
  ],
};
