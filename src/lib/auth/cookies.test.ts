import { describe, expect, it } from "vitest";

import { safeNext } from "./cookies";

describe("safeNext", () => {
  it("keeps in-app paths", () => {
    expect(safeNext("/wallet")).toBe("/wallet");
    expect(safeNext("/c/abc?state=best#x")).toBe("/c/abc?state=best#x");
  });
  it("refuses anything that could leave the site", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "wallet",
      "/%0d%0aSet-Cookie:x",
      "\u0000/x",
      "",
      null,
      undefined,
    ])
      expect(safeNext(bad as string), String(bad)).not.toMatch(
        /evil|javascript|^wallet$/,
      );
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
  });
  it("never loops back into sign-in", () => {
    expect(safeNext("/sign-in")).toBe("/");
    expect(safeNext("/sign-in/code")).toBe("/");
  });
});
