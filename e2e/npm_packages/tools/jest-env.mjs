// an import of a third-party package
import { jest } from '@jest/globals';

// a reference to a linked workspace project
import { id as e2eLibId } from '@e2e/lib'

global.globalJestEnvInit = function() {
    jest.useFakeTimers();
    global.foo = e2eLibId()
}