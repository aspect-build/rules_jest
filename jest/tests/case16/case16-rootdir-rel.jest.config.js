module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  // A relative rootDir must resolve against the config's own directory.
  rootDir: "rootdir_rel",
  setupFiles: ["<rootDir>/rootdir_rel.setup.js"],
};
