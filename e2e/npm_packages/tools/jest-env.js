// an import of a third-party package
const { jest } = require('@jest/globals');

// a reference to a linked workspace project
const  { id: e2eLibId } = require('@e2e/lib')

global.globalJestEnvInit = function() {
    jest.useFakeTimers();
    global.foo = e2eLibId()
}