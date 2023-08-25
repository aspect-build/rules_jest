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
    '<rootDir>/node_modules/.aspect_rules_js/(?!(package-a|@scope\\+pkg-b)@)',
    /* or using relative pattern to match the second 'node_modules/' in 'node_modules/.aspect_rules_js/@scope+pkg-b@x.x.x/node_modules/@scope/pkg-b/' */
    'node_modules/(?!.aspect_rules_js|package-a|@scope/pkg-b)',
  ],
};
```

Note the `.aspect_rules_js` directory, and use of `\\+` for scoped packages.

### Concurrency - Bazel sharding and Jest concurrency

By default Jest runs tests concurrently using workers. This conflicts with Bazel which also runs tests and actions in parallel. Jest concurrency will be configured by `rules_jest` to work optimally with Bazel actions and Bazel test sharding. If necessary this can be overridden using `jest_test(run_in_band = False)`.

### `ts-jest`

`ts-jest` is often used to write and run Jest tests using TypeScript. With short-lived Bazel actions compiling TypeScript on each invocation can cause performance issues. Using [`rules_ts`](https://github.com/aspect-build/rules_ts) is recommended to run and cache the  TypeScript compilation, removing the need for `ts-jest` and runtime compilation.

### Jest `haste`

By default Jest uses `jest-haste-map` to optimize and cache fs operations which must be configured to work with Bazel. `rules_jest` will automatically configure `haste` for compatibility with`rules_jest` and `rules_js`. Care must be taken with custom Jest configurations when configuring `haste`.