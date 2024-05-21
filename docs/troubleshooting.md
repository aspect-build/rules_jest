# Common troubleshooting tips

## Configuration

`rules_jest` configures Jest to work optimally with Bazel and [`rules_js`](https://github.com/aspect-build/rules_js). Custom configuration may conflict with the default `rules_jest` configurations and care should be taken when configuring Jest.

## `rules_js` virtual store

Similar to pnpm, [`rules_js`](https://github.com/aspect-build/rules_js) uses a virtual store for npm packages. This can cause issues with Jest and may require package hoisting similar to pnpm. See the pnpm [public hoist pattern](https://pnpm.io/npmrc#public-hoist-pattern) documentation for details and [rules_js public_hoist_packages](https://docs.aspect.build/rules/aspect_rules_js/docs/npm_translate_lock#public_hoist_packages) for configuring `rules_js` package hoisting.

## Performance

Jest is designed to run as a standalone long running application, often having a slow startup time then running incrementally using caching for performance. This conflicts with Bazel which designed for short-lived processes that can be run in parallel and cached.

Common performance issues include:

### `transformIgnorePatterns`

By default Jest ignores and does not transform `node_modules/*`. This is often overridden to [transform a subset of modules](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring). When using rules_js or pnpm the ignore pattern must match the package within the virtual store. See the [`transformIgnorePatterns` notes for pnpm](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring). If this is misconfigured to not properly ignore `node_modules/*` it may cause significant performance issues.

Example configuration of `transformIgnorePatterns` with `rules_jest`:

```javascript
const config = {
  transformIgnorePatterns: [
    "<rootDir>/node_modules/.aspect_rules_js/(?!(package-a|@scope\\+pkg-b)@)",
    /* or using relative pattern to match the second 'node_modules/' in 'node_modules/.aspect_rules_js/@scope+pkg-b@x.x.x/node_modules/@scope/pkg-b/' */
    "node_modules/(?!.aspect_rules_js|package-a|@scope/pkg-b)",
  ],
};
```

Note the `.aspect_rules_js` directory, and use of `\\+` for scoped packages.

### Concurrency - Bazel sharding and Jest concurrency

By default Jest runs tests concurrently using workers. This conflicts with Bazel which also runs tests and actions in parallel. Jest concurrency will be configured by `rules_jest` to work optimally with Bazel actions and Bazel test sharding. If necessary this can be overridden using `jest_test(run_in_band = False)`.

### `ts-jest`

`ts-jest` is often used to write and run Jest tests using TypeScript. With short-lived Bazel actions compiling TypeScript on each invocation can cause performance issues. Using [`rules_ts`](https://github.com/aspect-build/rules_ts) is recommended to run and cache the TypeScript compilation, removing the need for `ts-jest` and runtime compilation.

### Jest `haste`

By default Jest uses `jest-haste-map` to optimize and cache fs operations which must be configured to work with Bazel. `rules_jest` will automatically configure `haste` for compatibility with`rules_jest` and `rules_js`. Care must be taken with custom Jest configurations when configuring `haste`.

The settings defined by `rules_jest` are `{ enableSymlinks: true }`, but if you define your own `haste:` settings (in a custom jest config), they will be _merged_ with the rules_jest defaults.

_Note_: If you are importing a preset, and _it_ declares its own `haste` config, those will not be merged. This is an implementation detail of jest. The only workaround is to copy those settings into your local *jest.config.js* file.

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
