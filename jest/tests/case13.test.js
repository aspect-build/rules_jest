const path = require("path");
const fs = require("fs");

test("it should work", () => {
  expect(1).toBe(1);
});

test("it should use the cache directory under TEST_TMPDIR", () => {
  const jestCacheDirectory = path.join(process.env.TEST_TMPDIR, "jest_cache");
  expect(fs.existsSync(jestCacheDirectory)).toBe(true);
  const cacheContents = fs.readdirSync(jestCacheDirectory);
  expect(cacheContents.length).toBeGreaterThan(0);
});
