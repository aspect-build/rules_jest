// #288: the user drives `coverageReporters` themselves. jest_test must honor it
// (not override) and the emitted `coverage.dat` must still land where Bazel
// expects, in both inline and split post-processing modes.
module.exports = {
  coverageReporters: ["text", ["lcovonly", { file: "coverage.dat" }]],
};
