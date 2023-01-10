import { id } from './index'

global.globalJestEnvInit()

describe('lib', () => {
    test('returns the id()', () => expect(id).toBeTruthy())
})