const path = require("node:path");

// We could use `const { EXTENSION } = require("jest-snapshot");` instead but jest-snapshot
// is a transitive dep of jest-cli so its simpler just to assume "snap" is the extension as it
// is not likely to ever change.
const EXTENSION = "snap";
const DOT_EXTENSION = `.${EXTENSION}`;

if (!process.env.JEST_TEST__UPDATE_SNAPSHOTS) {
  console.error(
    `[rules_jest]: internal error - ${__filename} should only be used for snapshot update.`
  );
  process.exit(1);
}

if (!process.env.BUILD_WORKSPACE_DIRECTORY) {
  console.error(
    `[rules_jest]: snapshot update must be 'bazel run', not 'bazel test'.`
  );
  process.exit(1);
}

// Default snapshot resolver based on
// https://github.com/facebook/jest/blob/6e5b1d60a1214e792b5229993b5475445e9c1a6e/packages/jest-snapshot/src/SnapshotResolver.ts#L59.
// The `jest-snapshot` npm packages doesn't export the `createDefaultSnapshotResolver()` function
// that we could use to create this.
// TODO: submit a PR upstream to export createDefaultSnapshotResolver().
const defaultSnapshotResolver = {
  resolveSnapshotPath: (testPath) =>
    path.join(
      path.join(path.dirname(testPath), "__snapshots__"),
      path.basename(testPath) + DOT_EXTENSION
    ),

  resolveTestPath: (snapshotPath) =>
    path.join(
      path.dirname(path.dirname(snapshotPath)),
      path.basename(snapshotPath, DOT_EXTENSION)
    ),

  testPathForConsistencyCheck: path.posix.join(
    "consistency_check",
    "__tests__",
    "example.test.js"
  ),
};

// Use either the default or the user specified snapshot resolver
let snapshotResolver = process.env.JEST_TEST__USER_SNAPSHOT_RESOLVER
  ? require(process.env.JEST_TEST__USER_SNAPSHOT_RESOLVER)
  : defaultSnapshotResolver;

// The root test directory aligning with the workspace source root directory.
const ROOT = path.join(process.env.TEST_SRCDIR, process.env.TEST_WORKSPACE);

// This run of Jest is meant for generating reference snapshots for the snapshots update Bazel target.

// Switch the directory of snapshots to within the src dir (BUILD_WORKSPACE_DIRECTORY) instead
// of the snapshots dir in bazel-bin.
//
// This means none of the snapshots copied into the bin dir will be used, all will be considered
// snapshot test failures and be written to BUILD_WORKSPACE_DIRECTORY.
const origSnapshotResolver = snapshotResolver;
snapshotResolver = {
  ...origSnapshotResolver,

  resolveSnapshotPath: (testPath) => {
    let orig = origSnapshotResolver.resolveSnapshotPath(testPath);

    if (path.isAbsolute(orig)) {
      orig = path.join(
        process.env.BUILD_WORKSPACE_DIRECTORY,
        path.relative(ROOT, orig)
      );
    }

    return orig;
  },

  resolveTestPath: (snapshotPath) => {
    let orig = origSnapshotResolver.resolveTestPath(snapshotPath);

    if (path.isAbsolute(orig)) {
      orig = path.join(
        ROOT,
        path.relative(process.env.BUILD_WORKSPACE_DIRECTORY, orig)
      );
    }

    return orig;
  },
};

module.exports = snapshotResolver;
