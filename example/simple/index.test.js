const index = require(".");

jest.setTimeout(100000);

test("it should work", (done) => {
  expect(index).toBe("test");
  setTimeout(done, 65000);
});
