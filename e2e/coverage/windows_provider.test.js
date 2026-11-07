const { foobar } = require("./foo.js");

// On Windows the babel provider's instrumented paths do not match the runfiles
// tree, so rules_jest defaults to v8. v8 coverage does not define __coverage__.
test("windows defaults coverageProvider to v8", () => {
  expect(foobar(1)).toBe("pos");
  if (process.platform === "win32" && process.env.COVERAGE_DIR) {
    expect(globalThis.__coverage__).toBeUndefined();
  }
});
