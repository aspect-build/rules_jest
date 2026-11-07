// Excluded by the --test_filter in .bazelrc.
test("failing", () => {
  expect(true).toBe(false);
});
