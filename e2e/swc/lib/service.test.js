import * as starService from "./service";
import { exportedMethod } from "./service";
const requireService = require("./service");

// Testing the non-mocked service

test("star import", () => {
  expect(starService.exportedMethod()).toBe("the service");
});

test("direct import", () => {
  expect(exportedMethod()).toBe("the service");
});

test("dynamic import()", async () => {
  expect((await import("./service")).exportedMethod()).toBe("the service");
});

test("require", () => {
  expect(requireService.exportedMethod()).toBe("the service");
});

test("inline require", () => {
  expect(require("./service").exportedMethod()).toBe("the service");
});
