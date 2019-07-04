import path from 'path';

const onlyUnique = (value, index, self) => self.indexOf(value) === index;
const uniq = xs => xs.filter(onlyUnique);

const exists = x => x.length > 0;

export default function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let config;
  try {
    const configPath = path.resolve(options.config);
    config = require(configPath); // eslint-disable-line
  } catch (e) {
    console.log('Config not found');
    return file.source;
  }

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

  // create an import declaration
  const makeImport = ({ members = [], module, defaultName = null }) => {
    const validMembers = members.filter(member => member);
    const importSpecifiers = validMembers.map(x =>
      j.importSpecifier(j.identifier(x)));

    const specifiers = defaultName
      ? [
        j.importDefaultSpecifier(j.identifier(defaultName)),
        ...importSpecifiers,
      ]
      : importSpecifiers;

    return j.importDeclaration(specifiers, j.literal(module));
  };

  // collection members that match a predicate
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

  if (config.ignoreMark) {
    if (
      exists(
        (root.find(j.Comment) || [])
          .filter(x => x.value.value.includes(config.ignoreMark)),
      )
    ) {
      return file.source;
    }
  }

  (config.mappings || []).forEach((mapping) => {
    const { module, specifiers } = mapping;
    const fromImport = findImport(module.from);
    const toImport = findImport(module.to);

    let defaultName = null;
    let defaultToNamed = false;

    const fromModules = Array.isArray(specifiers)
      ? specifiers
      : Object.keys(specifiers);

    const containsWildcard = fromModules.includes('*');

    const existsInModule = member =>
      (containsWildcard ? true : fromModules.includes(member.node.local.name));

    const lookupTargetImport = (name) => {
      if (Array.isArray(specifiers)) {
        return name;
      }

      // When changing a named import to default import...
      if (name !== 'default' && specifiers[name] === 'default') {
        // Flag it...
        defaultName = name;
        // And don't return the named import
        return '';
      }

      return specifiers[name];
    };

    const shouldBeMoved = [
      ...membersMatchingPred(fromImport, existsInModule, true),
    ];

    if (fromModules.includes('default')) {
      const defaults = findImport(module.from).find(j.ImportDefaultSpecifier);

      const toDefault = lookupTargetImport('default');
      if (toDefault === 'default') {
        // TODO: lol how do I just find one?
        defaults.forEach((x) => {
          defaultName = x.node.local.name;
        });
      } else {
        defaultToNamed = true;
      }

      defaults.remove();
    }

    if (!exists(shouldBeMoved) && !defaultToNamed && !defaultName) {
      return file.source;
    }

    let newImports = null;
    if (defaultToNamed) {
      newImports = ['default', ...shouldBeMoved].map(lookupTargetImport);
    } else {
      newImports = shouldBeMoved.map(lookupTargetImport);
    }

    // if we already have an import declaration for the target
    if (exists(toImport)) {
      const existingMembers = membersMatchingPred(toImport, () => true);
      const targetMembers = uniq([...existingMembers, ...newImports]);
      const newImport = makeImport({
        members: targetMembers,
        module: module.to,
        defaultName,
      });

      toImport.replaceWith(newImport);
    } else {
      const newImport = makeImport({
        members: newImports,
        module: module.to,
        defaultName,
      });
      fromImport.insertAfter(newImport);
    }

    if (emptyImport(findImport(module.from))) {
      fromImport.remove();
    }

    return false;
  });

  return root.toSource({ quote: 'single' });
}
