class BazelSnapshotReporter {
  onRunComplete(_, results) {
    if (results.numFailedTests && results.snapshot.failure) {
      console.log(`
================================================================================
      
Update snapshots by running,

  bazel run ${process.env["TEST_TARGET"].replace(/_bin$/, "")}_update_snapshots

New '__snapshots__' directories must be created manually before running
'${process.env["TEST_TARGET"].replace(/_bin$/, "")}_update_snapshots' for them
to be included in the update target if 'snapshots' is set to 'True' or a custom
glob pattern.

================================================================================
`);
    }
  }
}

module.exports = BazelSnapshotReporter;
