// @vitest-environment node
import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("passwords", () => {
  it("hashes with a salt and verifies", async () => {
    const a = await hashPassword("coffee-shop-7");
    const b = await hashPassword("coffee-shop-7");
    expect(a).toMatch(/^scrypt\$16384\$8\$1\$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword("coffee-shop-7", a)).toBe(true);
    expect(await verifyPassword("coffee-shop-8", a)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});
