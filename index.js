const isReactNativeImport = path =>
  path.node.source.value === 'react-native'

const addPrimitivesImport = (j, root, imports) => {
  const importSpecifiers = [];
  imports.forEach(i => {
    importSpecifiers.push(j.importSpecifier(j.identifier(i)));
  });
  const importStatement = j.importDeclaration(
    importSpecifiers,
    j.literal('react-primitives'),
  );

  root
    .find(j.ImportDeclaration)
    .filter(isReactNativeImport)
    .forEach(path => {
      j(path).insertAfter(importStatement);
    });
};

const PRIMITIVES = [
  'Animated',
  'StyleSheet',
  'View',
  'Text',
  'Image',
  'Touchable',
  'Platform',
];

const removePrimitiveImports = (j, root) => {
  let hasModifications = false;
  
  const imports = new Set();
  
  root
    .find(j.Identifier)
    .filter(
      path =>
        path.parent.node.type === 'ImportSpecifier' &&
        path.parent.parent.node.source.value === 'react-native' &&
        PRIMITIVES.includes(path.node.name),
    )
    .forEach(path => {
      imports.add(path.node.name);
      hasModifications = true;
      const importDeclaration = path.parent.parent.node;

      importDeclaration.specifiers = importDeclaration.specifiers.filter(
        specifier =>
          !specifier.imported || specifier.imported.name !== path.node.name,
      );
    });

  addPrimitivesImport(j, root, imports);

  return hasModifications;
};

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let hasModifications = false;

  hasModifications = removePrimitiveImports(j, root);

  return hasModifications ? root.toSource({quote: 'single'}) : null;
}
