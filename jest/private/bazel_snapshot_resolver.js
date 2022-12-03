const path = require("node:path");
const { EXTENSION } = require("jest-snapshot");

const DOT_EXTENSION = `.${EXTENSION}`;

// Must match REFERENCE_SNAPSHOT_SUFFIX in //jest:defs.bzl
const REFERENCE_SNAPSHOT_SUFFIX = "-out";

// Must match REFERENCE_SNAPSHOT_DIRECTORY in //jest:defs.bzl
const REFERENCE_SNAPSHOT_DIRECTORY = "out";

const INTERNAL_ERROR_MSG =
  "rules_jest internal error, please file an issue: https://github.com/aspect-build/rules_jest/issues";

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
  // This run of Jest is meant for generating reference snapshots for the snapshots update Bazel target
  if (process.env.JEST_TEST__UPDATE_SNAPSHOTS == "directory") {
    // If we're updating snapshots with Bazel then switch the directory that snapshots are written
    // to to REFERENCE_SNAPSHOT_DIRECTORY so the generated snapshot path is different from the
    // source snapshot path allowing us to use write_source_files to for the update target.
    const origSnapshotResolver = snapshotResolver;
    snapshotResolver = {
      ...origSnapshotResolver,

      resolveSnapshotPath: (testPath) => {
        const orig = origSnapshotResolver.resolveSnapshotPath(testPath);
        return path.join(
          path.dirname(orig),
          REFERENCE_SNAPSHOT_DIRECTORY,
          path.basename(orig)
        );
      },

      resolveTestPath: (snapshotPath) => {
        const orig = origSnapshotResolver.resolveTestPath(snapshotPath);
        return path.join(path.dirname(path.dirname(orig)), path.basename(orig));
      },
    };
  } else if (process.env.JEST_TEST__UPDATE_SNAPSHOTS == "files") {
    // If we're updating snapshots with Bazel then append a REFERENCE_SNAPSHOT_SUFFIX to the
    // snapshot path so the generated snapshot path is different from the source snapshot path
    // allowing us to use write_source_files to for the update target.
    const origSnapshotResolver = snapshotResolver;
    snapshotResolver = {
      ...origSnapshotResolver,

      resolveSnapshotPath: (testPath) =>
        origSnapshotResolver.resolveSnapshotPath(testPath) +
        REFERENCE_SNAPSHOT_SUFFIX,

      resolveTestPath: (snapshotPath) =>
        origSnapshotResolver.resolveTestPath(
          snapshotPath.substr(
            0,
            snapshotPath.length - REFERENCE_SNAPSHOT_SUFFIX.length
          )
        ),
    };
  } else {
    throw new Error(INTERNAL_ERROR_MSG);
  }
}

module.exports = snapshotResolver;
