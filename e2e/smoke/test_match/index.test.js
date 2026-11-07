const { answer } = require("./helper");

test("testMatch is preserved with --test_filter", () => {
  expect(answer).toBe(42);
});
