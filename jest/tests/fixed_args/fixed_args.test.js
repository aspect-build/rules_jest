test("fixed_args are forwarded to the jest process", () => {
  // The jest_test `fixed_args = ["--silent"]` attribute should pass --silent
  // through to the jest CLI, which (with run_in_band) runs in this process.
  expect(process.argv).toContain("--silent");
});
