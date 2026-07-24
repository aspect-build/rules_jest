// Reproduction for https://github.com/aspect-build/rules_jest/issues/201.
//
// The user's jest config supplies `jest-junit` via `require.resolve("jest-junit")`
// (an absolute path). jest_test's reporter auto-configuration compares reporter
// names literally, so it fails to recognize the already-present jest-junit and
// injects a second one. This custom reporter receives the fully-resolved reporter
// list in `globalConfig.reporters` and throws if jest-junit appears more than once.
//
// Fails today (bug present); passes once jest_test dedupes require.resolve'd reporters.
class AssertSingleJunitReporter {
  constructor(globalConfig) {
    const junitReporters = (globalConfig.reporters || []).filter((r) => {
      const name = Array.isArray(r) ? r[0] : r;
      return typeof name === "string" && /jest-junit/.test(name);
    });
    if (junitReporters.length > 1) {
      throw new Error(
        `aspect_rules_jest[#201]: jest-junit reporter configured ${junitReporters.length} times; ` +
          `expected exactly 1. jest_test injected a duplicate because the user's reporter ` +
          `was supplied via require.resolve() and not recognized by the literal name check.\n` +
          JSON.stringify(junitReporters, null, 2),
      );
    }
  }
  onRunComplete() {}
}
module.exports = AssertSingleJunitReporter;
