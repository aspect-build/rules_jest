// https://github.com/aspect-build/rules_jest/issues/201
// The user config supplies the `jest-junit` reporter via an absolute path
// resolved by `require.resolve` rather than the bare `"jest-junit"` name.
// jest_test's auto-configuration must recognize this as jest-junit and not
// inject a second, duplicate jest-junit reporter. The assert-single-junit
// reporter fails the run if a duplicate is present.
module.exports = {
  reporters: [
    "default",
    [require.resolve("jest-junit"), {}],
    require.resolve("./assert-single-junit.cjs"),
  ],
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
};
