# smoke test

This e2e exercises the repo from an end-users perpective.
It catches mistakes in our install instructions, or usages that fail when called from an "external" repository to rules_jest.

This workspace has an intentionally failing test file; `.bazelrc` applies
`--test_filter` to exclude it by default.

```sh
bazel test //:test
bazel test --test_filter="failing" //:test
```
