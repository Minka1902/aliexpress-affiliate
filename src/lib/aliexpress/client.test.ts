import { describe, it, expect } from "vitest";
import { sign } from "./client";

describe("IOP sign", () => {
  it("is deterministic and order-independent (sorted keys)", () => {
    const secret = "shhh";
    const a = sign({ b: "2", a: "1", method: "x" }, secret);
    const b = sign({ method: "x", a: "1", b: "2" }, secret);
    expect(a).toBe(b);
  });

  it("produces uppercase hex HMAC-SHA256", () => {
    const out = sign({ a: "1" }, "secret");
    expect(out).toMatch(/^[0-9A-F]{64}$/);
  });

  it("changes when a value changes", () => {
    const s1 = sign({ a: "1" }, "secret");
    const s2 = sign({ a: "2" }, "secret");
    expect(s1).not.toBe(s2);
  });
});
