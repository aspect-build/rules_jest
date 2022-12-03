class BazelSnapshotReporter {
  onRunComplete(_, results) {
    if (results.numFailedTests && results.snapshot.failure) {
      console.log(`
================================================================================
      
Update snapshots by running,

  bazel run ${process.env["TEST_TARGET"].replace(/_bin$/, "")}_update_snapshots

================================================================================
`);
    }
  }
}

module.exports = BazelSnapshotReporter;
