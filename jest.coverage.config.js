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
  verbose: false,
  bail: false,
  resetModules: true,
  roots: [
    '<rootDir>/src/test/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: -10,
    },
  },
};
