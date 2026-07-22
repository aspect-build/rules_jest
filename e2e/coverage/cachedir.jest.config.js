// Regression for the coverage fix writing its generated resolver into
// config.cacheDirectory: a `<rootDir>` token here is unexpanded when rules_jest
// runs, so the resolver must be written somewhere else (TEST_TMPDIR).
module.exports = {
  cacheDirectory: "<rootDir>/.jest-cache",
};
