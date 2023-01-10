import * as assert from 'uvu/assert';
import { id } from './index'

// Referenced to something setup via the jest config
global.globalJestEnvInit()

describe('lib', () => {
    test('asserts is', () => assert.is(2 + 2, 4))
    test('returns the id()', () => expect(id()).toBeTruthy())
})