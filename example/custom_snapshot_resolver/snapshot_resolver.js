const path = require("node:path");

const DOT_EXTENSION = `.snap`;

module.exports = {
  resolveSnapshotPath: (testPath) =>
    path.join(path.dirname(testPath), path.basename(testPath) + DOT_EXTENSION),

  resolveTestPath: (snapshotPath) =>
    path.join(
      path.dirname(snapshotPath),
      path.basename(snapshotPath, DOT_EXTENSION)
    ),

  testPathForConsistencyCheck: path.posix.join(
    "consistency_check",
    "__tests__",
    "example.test.js"
  ),
};
