module.exports = {
  mappings: [
    {
      module: {
        from: 'react-native',
        to: 'react-primitives',
      },
      specifiers: [
        'Animated',
        'StyleSheet',
        'View',
        'Text',
        'Image',
        'Touchable',
        'Platform',
      ],
    },
  ],
};
