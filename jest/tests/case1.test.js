test("it sets the JEST_JUNIT_OUTPUT_FILE env var to the Bazel xml test log", () => {
  expect(
    process.env.JEST_JUNIT_OUTPUT_FILE.endsWith(
      "testlogs/jest/tests/case1/test.xml"
    )
  ).toEqual(true);
});
