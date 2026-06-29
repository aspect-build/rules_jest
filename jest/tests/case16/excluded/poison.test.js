// In `data` but outside the user-supplied `roots`; running it means `roots` was not preserved.
test("a test outside the user-supplied roots must not be discovered", () => {
  throw new Error("discovered a test outside the user-supplied roots");
});
