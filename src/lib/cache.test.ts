import { describe, it, expect } from "vitest";
import { cacheGet, cacheSet, cached } from "./cache";

describe("ttl cache", () => {
  it("stores and retrieves within ttl", () => {
    cacheSet("k1", 42, 1000);
    expect(cacheGet<number>("k1")).toBe(42);
  });
  it("expires after ttl", () => {
    cacheSet("k2", "v", -1); // already expired
    expect(cacheGet("k2")).toBeUndefined();
  });
  it("cached() computes once then serves cache", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      return "x";
    };
    await cached("k3", 1000, fn);
    await cached("k3", 1000, fn);
    expect(calls).toBe(1);
  });
});
