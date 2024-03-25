# Troubleshooting and common challenges

## Pre-transpiled sources

Frequently outside the Bazel ecosystem sources such as `*.ts` are transpiled on the fly using tools such as `ts-jest` or `babel-jest`. Such tools are designed for Jest and transpile to a javascript format ideal for Jest but normally not for production use.

Transpiling in bazel is normally done ahead of time to take advantage of bazel caching, ensure that the build is hermetic, ensure the tested code is the same as production code etc. However this transpiling is no longer designed specifically for Jest like `ts-jest` or `babel-jest` which may lead to certain limitations. For example:

### Runtime tsconfig dependency

If a plugin such as `ts-jest` or `ts-node` is replaced with `rules_ts` (to pre-compile ts files instead of runtime compilation), features such as runtime `tsconfig` path mapping must be replaced with other tools such as `tsconfig-paths`.

### ESM Modules

Normally Jest uses CommonJS modules (such as when `ts-jest` or `babel-jest` does transpiling on the fly), but with bazel the transpiled sources are normally pre-transpiled and remain as native ESM modules for optimal use by bundlers and other tools.

ESM modules come with certain challenges in NodeJS and therefor also in Jest, see:

- NodeJS support for ESM modules: https://nodejs.org/api/esm.html
- Module mocking with ESM: https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm

See https://jestjs.io/docs/ecmascript-modules for the full Jest documentation on ESM modules.

### Readonly CommonJS `exports`

When ESM modules are transpiled to CommonJS different transpilers may produce different variants of CommonJS.

For example [SWC](https://swc.rs/) (normally used in bazel with [rules_swc](https://github.com/aspect-build/rules_swc)) transpiles ESM imports to align with ESM standards as closely as possible at runtime, even when transpiled to CommonJS. This leads to the same [Module mocking with ESM](https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm) issue as native ESM modules.

See the [SWC test](e2e/swc/README.md) for examples and more information.

Other transpilers such as `babel` or `tsc` may have similar issues or configuration to workaround such issues.
