const path = require("node:path");
const { EXTENSION } = require("jest-snapshot");

const DOT_EXTENSION = `.${EXTENSION}`;

// Must match GENERATED_SNAPSHOT_SUFFIX in //jest:defs.bzl
const GENERATED_SNAPSHOT_SUFFIX = "-generated";

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

if (process.env.JEST_TEST__UPDATE_SNAPSHOTS) {
  // If we're updating snapshots then append a GENERATED_SNAPSHOT_SUFFIX to the snapshot path so the
  // generated snapshot path is different from the source snapshot path allowing us to use
  // write_source_files to for the update target.
  origSnapshotResolver = snapshotResolver;
  snapshotResolver = {
    resolveSnapshotPath: (testPath) =>
      origSnapshotResolver.resolveSnapshotPath(testPath) +
      GENERATED_SNAPSHOT_SUFFIX,
    resolveTestPath: (snapshotPath) =>
      origSnapshotResolver.resolveTestPath(
        snapshotPath.substr(
          0,
          snapshotPath.length - GENERATED_SNAPSHOT_SUFFIX.length
        )
      ),
    testPathForConsistencyCheck:
      origSnapshotResolver.testPathForConsistencyCheck,
  };
}

module.exports = snapshotResolver;
