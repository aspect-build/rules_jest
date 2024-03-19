test("env_inherit", () => {
  expect(process.env.LANG).toContain(".");
});
