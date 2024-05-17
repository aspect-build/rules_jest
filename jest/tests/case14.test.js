const {foo} = require('./case14-lib');

test("it should work", () => {
  expect(foo).toBe('foo');
});
