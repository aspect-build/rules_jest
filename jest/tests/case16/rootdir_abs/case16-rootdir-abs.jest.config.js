// `__dirname` is an absolute rootDir, so `<rootDir>` must resolve back to it.
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/*.test.js"],
  rootDir: __dirname,
  setupFiles: ["<rootDir>/rootdir_abs.setup.js"],
};
