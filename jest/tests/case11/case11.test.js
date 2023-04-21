const { foobar } = require("./case11.index.js");

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
