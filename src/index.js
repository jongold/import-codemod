import path from 'path';
import { contains, T, uniq } from 'ramda';

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
    const importSpecifiers = members.map(x =>
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

    const fromModules = Array.isArray(specifiers)
      ? specifiers
      : Object.keys(specifiers);

    const containsWildcard = contains('*', fromModules);

    const existsInModule = member =>
      (containsWildcard ? true : fromModules.includes(member.node.local.name));

    const lookupTargetImport = name =>
      (Array.isArray(specifiers) ? name : specifiers[name]);

    const shouldBeMoved = [
      ...membersMatchingPred(fromImport, existsInModule, true),
    ];

    let defaultName = null;

    let defaultToNamed = false;

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
      const existingMembers = membersMatchingPred(toImport, T);
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
