/* eslint-env jest */
jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

// skip the codemode if we don't have react-native
defineTest(__dirname, 'index', null, 'NoReactNative');

// add React Primitives if it doesn't exist already
defineTest(__dirname, 'index', null, 'NoPrimitives');

// merge & sort an array of existing Primitives
defineTest(__dirname, 'index', null, 'ExistingPrimitives');

// remove an empty ReactNative import
defineTest(__dirname, 'index', null, 'EmptyReactNativeOutput');
