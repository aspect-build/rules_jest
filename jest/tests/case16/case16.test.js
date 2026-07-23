test("<rootDir> resolves to the user config dir regardless of target name", () => {
  expect(global.CASE16_SETUP_VALUE).toBe(16);
});
