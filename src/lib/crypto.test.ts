import { describe, it, expect, beforeAll } from "vitest";

describe("AES-GCM secret encryption", () => {
  beforeAll(() => {
    // 32-byte key, base64 — required by crypto.ts getKey()
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips a secret", async () => {
    const { encryptSecret, decryptSecret } = await import("./crypto");
    const plain = "sk-super-secret-key";
    const enc = encryptSecret(plain);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("produces different ciphertext each time (random IV)", async () => {
    const { encryptSecret } = await import("./crypto");
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });
});
