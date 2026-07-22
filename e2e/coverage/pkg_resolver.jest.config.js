// Regression for resolving a user `resolver` given by package name (rather than
// a filesystem path). jest-pnp-resolver delegates to the default resolver when
// Yarn PnP is inactive, so it behaves as a pass-through here.
module.exports = {
  resolver: "jest-pnp-resolver",
};
