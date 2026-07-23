// A wrong rootDir would fail to load the `<rootDir>` setup file.
test("an absolute user rootDir is left untouched", () => {
  expect(global.CASE16_ROOTDIR_ABS).toBe("abs");
});
