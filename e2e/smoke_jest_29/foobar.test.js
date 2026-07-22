const { foobar } = require("./foobar_lib.js");

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
