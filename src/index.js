import { T, uniq } from 'ramda';

const PRIMITIVES = [
  'Animated',
  'StyleSheet',
  'View',
  'Text',
  'Image',
  'Touchable',
  'Platform',
];

const isPrimitive = x => PRIMITIVES.includes(x.node.local.name);

const exists = x => x.length > 0;

export default function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const findImport = name =>
    root.find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: name,
      },
    });

  const emptyImport = theImport =>
    theImport &&
    !exists(theImport.find(j.ImportSpecifier)) &&
    !exists(theImport.find(j.ImportDefaultSpecifier));

  const makeImport = ({ members = [], module }) =>
    j.importDeclaration(
      members.sort().map(x => j.importSpecifier(j.identifier(x))),
      j.literal(module),
    );

  const membersMatchingPred = (collection, pred, removeMatches = false) => {
    const results = [];

    const matches = collection
      .find(j.ImportSpecifier)
      .filter(pred)
      .forEach(x => results.push(x.node.local.name));

    if (removeMatches) {
      matches.remove();
    }

    return results;
  };

  const reactNativeImport = findImport('react-native');
  const reactPrimitivesImport = findImport('react-primitives');

  if (!exists(reactNativeImport)) {
    return file.source;
  }

  const shouldBePrimitives = membersMatchingPred(
    reactNativeImport,
    isPrimitive,
    true,
  );

  if (!exists(shouldBePrimitives)) {
    return file.source;
  }

  if (exists(reactPrimitivesImport)) {
    const existingMembers = membersMatchingPred(reactPrimitivesImport, T);
    const targetMembers = uniq([...existingMembers, ...shouldBePrimitives]);
    const newImport = makeImport({
      members: targetMembers,
      module: 'react-primitives',
    });

    reactPrimitivesImport.replaceWith(newImport);
  } else {
    const newImport = makeImport({
      members: shouldBePrimitives,
      module: 'react-primitives',
    });
    reactNativeImport.insertAfter(newImport);
  }

  if (emptyImport(findImport('react-native'))) {
    reactNativeImport.remove();
  }

  return root.toSource({ quote: 'single' });
}
