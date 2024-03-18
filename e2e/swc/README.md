# Example showing usage and challenges using rules_jest with swc (via rules_swc)

## Mocking of esm exports when transforming to commonjs

When transforming esm to commonjs swc defines the exports as readonly. This is a problem when trying to mock the exports using `jest.spyOn()`.

Examples similar to this workaround (making esm imports `writeable`):

- https://stackoverflow.com/a/77157708
- https://stackoverflow.com/a/69951703

Other examples using `jest.mock()` instead of `jest.spyOn()`:

- https://github.com/aelbore/esbuild-jest/issues/26#issuecomment-968853688
- https://github.com/jestjs/jest/issues/14469#issuecomment-1743882885
