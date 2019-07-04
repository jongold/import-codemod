/* eslint-env jest */
import path from 'path';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

beforeEach(() => jest.resetModules());
const opts = { config: './config.js' };

const configPath = path.resolve(process.cwd(), opts.config);

describe('config as an array', () => {
  describe('named imports', () => {
    beforeEach(() => {
      jest.doMock(
        configPath,
        () => ({
          mappings: [
            {
              module: {
                from: 'beatles',
                to: 'the-beatles',
              },
              specifiers: ['John', 'Paul', 'George'],
            },
          ],
        }),
        { virtual: true },
      );
    });
    defineTest(__dirname, 'index', opts, 'NoExistingTarget');
    defineTest(__dirname, 'index', opts, 'ExistingTarget');
    defineTest(__dirname, 'index', opts, 'EmptyFrom');
  });

  describe('default imports', () => {
    beforeEach(() => {
      jest.doMock(
        configPath,
        () => ({
          mappings: [
            {
              module: {
                from: 'beatles',
                to: 'the-beatles',
              },
              specifiers: ['default'],
            },
          ],
        }),
        { virtual: true },
      );
    });
    defineTest(__dirname, 'index', opts, 'DefaultToDefault');
  });
});

describe('config as an object', () => {
  describe('named imports', () => {
    describe('no renames', () => {
      beforeEach(() => {
        jest.doMock(configPath, () => ({
          mappings: [
            {
              module: {
                from: 'beatles',
                to: 'the-beatles',
              },
              specifiers: {
                John: 'John',
                Paul: 'Paul',
                George: 'George',
              },
            },
          ],
        }));
      });
      defineTest(__dirname, 'index', opts, 'NoExistingTarget');
      defineTest(__dirname, 'index', opts, 'ExistingTarget');
      defineTest(__dirname, 'index', opts, 'EmptyFrom');
    });
    // defaults

    describe('w/ renames', () => {
      beforeEach(() => {
        jest.doMock(configPath, () => ({
          mappings: [
            {
              module: {
                from: 'beatles',
                to: 'the-beatles',
              },
              specifiers: {
                John: 'Lennon',
                Paul: 'McCartney',
                George: 'Harrison',
              },
            },
          ],
        }));
      });
      defineTest(__dirname, 'index', opts, 'Renames');
    });
  });

  describe('default import to default import', () => {
    beforeEach(() => {
      jest.doMock(configPath, () => ({
        mappings: [
          {
            module: {
              from: 'beatles',
              to: 'the-beatles',
            },
            specifiers: {
              default: 'default',
            },
          },
        ],
      }));
    });
    defineTest(__dirname, 'index', opts, 'DefaultToDefault');
  });

  describe('default import to named import', () => {
    beforeEach(() => {
      jest.doMock(configPath, () => ({
        mappings: [
          {
            module: {
              from: 'beatles',
              to: 'bands',
            },
            specifiers: {
              default: 'Beatles',
            },
          },
        ],
      }));
    });
    defineTest(__dirname, 'index', opts, 'DefaultToNamed');
  });

  describe('named import to default import', () => {
    beforeEach(() => {
      jest.doMock(configPath, () => ({
        mappings: [
          {
            module: {
              from: 'beatles',
              to: 'bands',
            },
            specifiers: {
              Beatles: 'default',
            },
          },
        ],
      }));
    });
    defineTest(__dirname, 'index', opts, 'NamedToDefault');
  });
});

describe('pattern', () => {
  beforeEach(() => {
    jest.doMock(configPath, () => ({
      mappings: [
        {
          module: {
            from: 'beatles',
            to: 'the-beatles',
          },
          specifiers: ['*'],
        },
      ],
    }));
  });
  defineTest(__dirname, 'index', opts, 'Pattern');
});

describe('config from a path', () => {
  // const opts = { config: './src/__tests__/config.js' };
  // defineTest(__dirname, 'index', opts, 'EmptyFrom');
});

describe('config ignore', () => {
  beforeEach(() => {
    jest.doMock(configPath, () => ({
      ignoreMark: '@ignoreMe',
    }));
  });
  defineTest(__dirname, 'index', opts, 'Ignore');
});
