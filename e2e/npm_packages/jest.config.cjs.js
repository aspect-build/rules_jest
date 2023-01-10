const path = require("path")

// ESM node packages that need to be transformed to cjs.
const ESM_NPM_DEPS = [
  "@e2e/lib",
  "@e2e/wrapper-lib"
]

const rootDir = process.cwd()
const ESM_NPM_DEPS_RE_OR = ESM_NPM_DEPS.join("|")

module.exports = {
  "transform": {
    "\\.js$": 'babel-jest',
  },

  // PNPM-style rules_js ignore patterns to enable transforms
  // on the workspace @e2e/* packages.
  // See pnpm notes: https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
  transformIgnorePatterns: [
    // packages within the root ules_js package store
    `<rootDir>/node_modules/.aspect_rules_js/(?!(${ESM_NPM_DEPS_RE_OR})@)`,
    // files under a subdir: eg. '/packages/lib-a/'
    `${rootDir}/(../)+node_modules/.aspect_rules_js/(?!(${ESM_NPM_DEPS_RE_OR})@)`,
    // packages nested within another
    `node_modules/(?!.aspect_rules_js|${ESM_NPM_DEPS_RE_OR})`,
  ],

  setupFiles: [
    path.join(process.cwd(), "tools/jest-env.js")
  ],
}
