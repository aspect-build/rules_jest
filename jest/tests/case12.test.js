const { foobar } = require("./case12.index.js");

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
