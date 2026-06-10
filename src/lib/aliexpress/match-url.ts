// Client-safe AliExpress URL matching (no server-only imports). Used by both the server
// parse-url module and the client clipboard watcher.

export const ALIEXPRESS_HOSTS = [
  "aliexpress.com",
  "aliexpress.us",
  "aliexpress.ru",
  "alibaba.com",
  "click.aliexpress.com",
  "s.click.aliexpress.com",
  "a.aliexpress.com",
  "m.aliexpress.com",
  "best.aliexpress.com",
  "campaign.aliexpress.com",
];

export function hostAllowed(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALIEXPRESS_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

export function isAliExpressUrl(text: string): boolean {
  try {
    const u = new URL(text.trim());
    return (u.protocol === "https:" || u.protocol === "http:") && hostAllowed(u.hostname);
  } catch {
    return false;
  }
}

/** Finds the first AliExpress URL inside an arbitrary string (e.g. clipboard with prose). */
export function extractAliExpressUrl(text: string): string | null {
  if (!text) return null;
  const matches = text.match(/https?:\/\/[^\s"'<>]+/gi);
  if (!matches) return null;
  for (const m of matches) {
    if (isAliExpressUrl(m)) return m;
  }
  return null;
}
