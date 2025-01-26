# Bazel rules for jest

Runs tests with the https://jestjs.io/ test runner under Bazel.

Many companies are successfully testing with rules_jest. If you're getting value from the project, please let us know! Just comment on our [Adoption Discussion](https://github.com/aspect-build/rules_js/discussions/1000).

rules_jest is just a part of what Aspect provides:

- _Need help?_ This ruleset has support provided by https://aspect.build/services
- See our other Bazel rules, especially those built for rules_js, such as rules_ts for TypeScript: https://github.com/aspect-build

## Installation

From the release you wish to use:
<https://github.com/aspect-build/rules_jest/releases>
copy the WORKSPACE snippet into your `WORKSPACE` file.

## Usage

Run all Jest tests in the workspace: `bazel test --test_lang_filters=jest //...`

See [jest_test](docs/jest_test.md) API documentation and the example usages in the [example](https://github.com/aspect-build/rules_jest/tree/main/example/) folder.

> Note that the example also relies on code in the `/WORKSPACE` file in the root of this repo.

## Troubleshooting and common challenges

For troubleshooting and common challenges, see [docs/troubleshooting.md](docs/troubleshooting.md).
