const { foobar } = require("./case6.index.js");

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
