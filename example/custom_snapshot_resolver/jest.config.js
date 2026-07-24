module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  // `<rootDir>` token form (idiomatic per Jest's docs); resolved by jest_test's
  // shared specifier helper. The sibling custom_snapshot_resolver_files covers
  // the relative `./` form.
  snapshotResolver: "<rootDir>/snapshot_resolver.js",
};
