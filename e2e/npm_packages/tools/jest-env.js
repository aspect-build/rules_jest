// an import of a third-party package
// Note: the binding is not named `jest` to avoid colliding with the `jest`
// local that jest-runtime injects into every module scope.
const jestGlobals = require("@jest/globals");

// a reference to a linked workspace project
const { id: e2eLibId } = require("@e2e/lib");

global.globalJestEnvInit = function () {
  jestGlobals.jest.useFakeTimers();
  global.foo = e2eLibId();
};
