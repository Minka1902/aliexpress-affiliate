// Extracts an AliExpress numeric product ID from a pasted URL. Handles /item/<id>.html,
// /i/<id>.html, query params, locale variants, and short/redirect links (resolved
// server-side with an SSRF host allowlist).

import { hostAllowed } from "./match-url";

function extractIdFromUrl(u: URL): string | null {
  // /item/1005006067128597.html  or /i/1005....html
  const m = u.pathname.match(/\/(?:item|i)\/(\d{6,})\.html/);
  if (m) return m[1];

  // bare /1005....html
  const m2 = u.pathname.match(/\/(\d{8,})\.html/);
  if (m2) return m2[1];

  // query params
  for (const key of ["productId", "itemId", "product_id", "id"]) {
    const v = u.searchParams.get(key);
    if (v && /^\d{6,}$/.test(v)) return v;
  }
  return null;
}

export interface ParseResult {
  productId: string | null;
  normalizedUrl: string;
  error?: string;
}

async function resolveShortLink(url: string, maxHops = 5): Promise<string> {
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      break;
    }
    if (!hostAllowed(parsed.hostname)) break;

    const res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
    }).catch(() => null);

    if (!res) break;
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, current).toString();
      continue;
    }
    break;
  }
  return current;
}

export async function parseAliExpressUrl(rawUrl: string): Promise<ParseResult> {
  let input = rawUrl.trim();
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return { productId: null, normalizedUrl: rawUrl, error: "Invalid URL" };
  }

  if (!hostAllowed(u.hostname)) {
    return { productId: null, normalizedUrl: input, error: "Not an AliExpress URL" };
  }

  // Direct extraction first.
  let productId = extractIdFromUrl(u);

  // Short/redirect links: resolve then re-extract.
  if (!productId) {
    const resolved = await resolveShortLink(input);
    try {
      const ru = new URL(resolved);
      productId = extractIdFromUrl(ru);
      if (productId) return { productId, normalizedUrl: resolved };
    } catch {
      /* ignore */
    }
  }

  return { productId, normalizedUrl: input, error: productId ? undefined : "Could not find a product ID" };
}
