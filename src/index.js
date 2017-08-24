import { T, uniq } from 'ramda';

const mappings = [
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
      'ActionSheetIOS',
      'Alert',
      'AppState',
      'AsyncStorage',
      'Clipboard',
      'ColorPropType',
      'Contacts',
      'DatePicker',
      'DeviceEventEmitter',
      'Dimensions',
      'Easing',
      'EventEmitter',
      'ImagePicker',
      'InteractionManager',
      'InvertibleScrollView',
      'Keyboard',
      'LayoutAnimation',
      'Linking',
      'ListView',
      'MapView',
      'NetInfo',
      'Permissions',
      'PixelRatio',
      'ScrollResponder',
      'ScrollView',
      'ScrollViewBase',
      'Slider',
      'StatusBar',
      'Swiper',
      'TextInput',
      'TouchableHighlight',
      'TouchableNativeFeedback',
      'TouchableOpacity',
      'TouchableWithoutFeedback',
      'Video',
      'WebView',
      'dismissKeyboard',
      'index',
      'withNodeHandle',
    ],
  },
];

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

  mappings.forEach((mapping) => {
    const fromImport = findImport(mapping.from);
    const toImport = findImport(mapping.to);

    const existsInModule = member =>
      mapping.modules.includes(member.node.local.name);

    if (!exists(fromImport)) {
      return file.source;
    }

    const shouldBeMoved = membersMatchingPred(fromImport, existsInModule, true);

    if (!exists(shouldBeMoved)) {
      return file.source;
    }

    if (exists(toImport)) {
      const existingMembers = membersMatchingPred(toImport, T);
      const targetMembers = uniq([...existingMembers, ...shouldBeMoved]);
      const newImport = makeImport({
        members: targetMembers,
        module: mapping.to,
      });

      toImport.replaceWith(newImport);
    } else {
      const newImport = makeImport({
        members: shouldBeMoved,
        module: mapping.to,
      });
      fromImport.insertAfter(newImport);
    }

    if (emptyImport(findImport(mapping.from))) {
      fromImport.remove();
    }

    return false;
  });

  return root.toSource({ quote: 'single' });
}
