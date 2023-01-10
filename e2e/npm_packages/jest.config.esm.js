const path = require("path")

module.exports = {
  transform: {},

  setupFiles: [
    path.join(process.cwd(), "tools/jest-env.mjs")
  ],
}