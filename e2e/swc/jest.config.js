const path = require("path");
module.exports = {
  setupFilesAfterEnv: [path.join(process.cwd(), "jest-swc-workaround.js")],
};
