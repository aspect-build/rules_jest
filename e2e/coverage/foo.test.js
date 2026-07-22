const { foobar } = require("./foo.js");

test("foobar", () => {
  expect(foobar(1)).toBe("pos");
});
