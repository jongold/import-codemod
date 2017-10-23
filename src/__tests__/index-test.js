/* eslint-env jest */
jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

// skip the codemode if we don't have react-native
defineTest(__dirname, 'index', null, 'NoReactNative');

// add React Primitives if it doesn't exist already
defineTest(__dirname, 'index', null, 'NoExistingPrimitives');

// merge & sort an array of existing Primitives
defineTest(__dirname, 'index', null, 'ExistingPrimitives');

// don't import react-primitives if we don't need it!
defineTest(__dirname, 'index', null, 'NoTargetPrimitives');

// remove an empty ReactNative import
defineTest(__dirname, 'index', null, 'EmptyReactNativeOutput');

// everything that isn't matched by Primitives should be Shared
defineTest(__dirname, 'index', null, 'WildcardToShared');
