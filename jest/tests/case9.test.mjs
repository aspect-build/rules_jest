import { foobar } from "./case9.index";

test("foobar", () => {
  expect(foobar()).toEqual("foobar");
});
