const { readFileSync } = require('fs');

const babelConfig = JSON.parse(readFileSync('./.babelrc', 'utf8'));

require('babel-register')(babelConfig);
require('babel-polyfill');

module.exports = {
  setupTestFrameworkScriptFile: './src/test/utils/globalTestInit.js',
  globalSetup: './src/test/utils/globalTestSetup.js',
  globalTeardown: './src/test/utils/globalTestTeardown.js',
  // testEnvironment: './mongo-environment.js'
  testEnvironment: 'node',
  verbose: true,
  transform: {
    '^.+\\.jsx$': 'babel-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: [
    'js',
    'jsx',
  ],
  moduleDirectories: [
    'node_modules',
  ],
  bail: false,
  resetModules: false,
  roots: [
    '<rootDir>/src/test/',
  ],
};
