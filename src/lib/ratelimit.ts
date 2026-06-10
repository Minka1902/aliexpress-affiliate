// Simple in-memory token bucket, keyed by an arbitrary string (e.g. userId:route).
// Adequate for a single-instance friends-and-family deployment. Resets on restart.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

interface Options {
  capacity: number; // max tokens
  refillPerSec: number; // tokens added per second
}

export function rateLimit(key: string, opts: Options): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  b.updatedAt = now;

  if (b.tokens < 1) {
    buckets.set(key, b);
    const retryAfter = Math.ceil((1 - b.tokens) / opts.refillPerSec);
    return { ok: false, retryAfter };
  }

  b.tokens -= 1;
  buckets.set(key, b);
  return { ok: true, retryAfter: 0 };
}

// Common presets
export const LIMITS = {
  linkGenerate: { capacity: 20, refillPerSec: 20 / 60 }, // ~20/min
  recommendations: { capacity: 30, refillPerSec: 30 / 60 },
  ai: { capacity: 10, refillPerSec: 10 / 60 }, // ~10/min
  wishlistRecheck: { capacity: 15, refillPerSec: 15 / 60 },
} as const;
