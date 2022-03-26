const path = require('path');

module.exports = {
  testEnvironment: 'node',
  // Needed for Jest to walk the filesystem to find inputs.
  // See https://github.com/facebook/jest/pull/9351
  // Ideally Bazel should pass this as an arg to the CLI but not supported:
  // https://github.com/facebook/jest/issues/11584
  haste: {
    enableSymlinks: true,
  },
  reporters: ['default'], // , './jest-reporter'],
  // // explicitly specify the path to babel.config.js relative to jest.config.js so
  // // jest can find it even when jest.config.js is not in the root folder of the workspace
  // transform:
  //     {'^.+\\.[jt]sx?$': ['babel-jest', {configFile: path.resolve(__dirname, 'babel.config.js')}]},
  testMatch: ['**/*.test.js']
};
