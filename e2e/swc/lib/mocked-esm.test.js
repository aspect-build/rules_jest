import * as starService from "./service";
import { exportedMethod } from "./service";
const requireService = require("./service");

jest.spyOn(starService, "exportedMethod").mockReturnValue("mock service");

test("star import", () => {
  expect(starService.exportedMethod()).toBe("mock service");
});

test("direct import", () => {
  expect(exportedMethod()).toBe("mock service");
});

test("dynamic import()", async () => {
  expect((await import("./service")).exportedMethod()).toBe("mock service");
});

test("require", () => {
  expect(requireService.exportedMethod()).toBe("mock service");
});

test("inline require", () => {
  expect(require("./service").exportedMethod()).toBe("mock service");
});
