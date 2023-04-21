const path = require("path");

// A config-time file dep
require("./case10.config-init");

// A config-time npm dep and config-time value to verify
global.TEST_CONFIG_VALUE = typeof require("@aspect-test/c").id === "function";

module.exports = {
  // A runtime setup dep
  setupFiles: [path.join(process.cwd(), "jest/tests/case10/case10.setup.js")],
};
