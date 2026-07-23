// A wrong rootDir would fail to load the `<rootDir>` setup file.
test("a relative user rootDir resolves against the config anchor", () => {
  expect(global.CASE16_ROOTDIR_REL).toBe("rel");
});
