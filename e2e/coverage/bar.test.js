const { foobar } = require("./bar.js");

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
