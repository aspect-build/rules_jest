/**
 * @fileoverview apply Bazel's --test_filter to the test files Jest discovered.
 *
 * Bazel passes --test_filter to the test in the TESTBRIDGE_TEST_ONLY environment variable. The
 * filter is a regular expression matched against test file paths. It is applied as a Jest `filter`
 * module so that it narrows the files selected by the user's `testMatch` or `testRegex` instead of
 * replacing them. Setting `testRegex` directly would conflict with a user `testMatch` and would
 * let the filter select non-test files.
 *
 * See https://jestjs.io/docs/cli#--filterfile
 */

const path = require("path");

const testFilter = new RegExp(process.env.TESTBRIDGE_TEST_ONLY || "");
// A filter module configured by the user, which this module wraps.
const userFilterPath = process.env.JEST_TEST__USER_FILTER;
const userFilter = userFilterPath ? require(userFilterPath) : undefined;

// Jest 30 expects `filtered` to be a list of test paths. Jest 29 and earlier expect a list of
// `{test: path}` objects.
const jestCliPackage = path.dirname(require.resolve("jest-cli/package.json"));
const jestMajor = Number(
  require(path.join(jestCliPackage, "package.json")).version.split(".")[0],
);

function _pathOf(result) {
  return typeof result === "string" ? result : result.test;
}

async function filter(testPaths) {
  let filtered = testPaths;
  if (userFilter) {
    filtered = (await userFilter(testPaths)).filtered.map(_pathOf);
  }
  filtered = filtered.filter((testPath) =>
    testFilter.test(testPath.split(path.sep).join("/")),
  );
  return {
    filtered: jestMajor >= 30 ? filtered : filtered.map((test) => ({ test })),
  };
}

if (userFilter && userFilter.setup) {
  filter.setup = userFilter.setup;
}

module.exports = filter;
