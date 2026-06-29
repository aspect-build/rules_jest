test("<rootDir> resolves to the user config dir when config is in a subdir", () => {
  expect(global.CASE16_SUBDIR_SETUP_VALUE).toBe(17);
});
