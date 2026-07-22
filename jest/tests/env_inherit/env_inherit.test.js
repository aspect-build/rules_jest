test("env_inherit", () => {
  // A host environment variable is passed through via the jest_test `env_inherit`
  // attribute: LANG (e.g. "en_US.UTF-8") on Unix, OS ("Windows_NT") on Windows.
  const inherited = process.env.LANG || process.env.OS;
  expect(inherited).toBeTruthy();
});
