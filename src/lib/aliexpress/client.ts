import crypto from "crypto";

// Minimal IOP (Alibaba/AliExpress Open Platform) client for the system interface gateway.
// Replicates what the official `iop` SDK does: build system + business params, sign with
// HMAC-SHA256 over the ASCII-sorted "k1v1k2v2..." concatenation, POST form-encoded.
//
// Secrets are read from process.env and MUST stay server-side.

const GATEWAY = process.env.ALIEXPRESS_GATEWAY || "https://api-sg.aliexpress.com/sync";

function appKey(): string {
  const k = process.env.ALIEXPRESS_APP_KEY;
  if (!k) throw new Error("ALIEXPRESS_APP_KEY is not set");
  return k;
}

function appSecret(): string {
  const s = process.env.ALIEXPRESS_APP_SECRET;
  if (!s) throw new Error("ALIEXPRESS_APP_SECRET is not set");
  return s;
}

/** HMAC-SHA256 sign over sorted key+value concatenation, hex uppercase. */
function sign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const base = sorted.map((k) => `${k}${params[k]}`).join("");
  return crypto.createHmac("sha256", secret).update(base, "utf8").digest("hex").toUpperCase();
}

export class AliExpressApiError extends Error {
  code?: string;
  subMsg?: string;
  constructor(message: string, code?: string, subMsg?: string) {
    super(message);
    this.name = "AliExpressApiError";
    this.code = code;
    this.subMsg = subMsg;
  }
}

export interface CallOptions {
  /** Phase 2: DS APIs require an OAuth access token (sent as the `session` param). */
  accessToken?: string;
}

/**
 * Calls an AliExpress IOP method. `bizParams` are the business parameters; undefined/null
 * values are dropped. Returns the inner `<method>_response` object.
 */
export async function callApi(
  method: string,
  bizParams: Record<string, string | number | boolean | undefined | null> = {},
  opts: CallOptions = {}
): Promise<Record<string, unknown>> {
  const params: Record<string, string> = {
    app_key: appKey(),
    method,
    timestamp: Date.now().toString(),
    sign_method: "sha256",
    format: "json",
    partner_id: "aff-app",
  };
  if (opts.accessToken) params.session = opts.accessToken;

  for (const [k, v] of Object.entries(bizParams)) {
    if (v === undefined || v === null) continue;
    params[k] = typeof v === "string" ? v : String(v);
  }

  params.sign = sign(params, appSecret());

  const body = new URLSearchParams(params).toString();

  // Fail fast instead of hanging if the gateway is slow/unreachable.
  const timeoutMs = Number(process.env.ALIEXPRESS_TIMEOUT_MS || 8000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    throw new AliExpressApiError(
      controller.signal.aborted ? "Gateway timeout" : `Gateway error: ${(e as Error).message}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new AliExpressApiError(`Gateway HTTP ${res.status}`);
  }

  const json = (await res.json()) as Record<string, unknown>;

  if (json.error_response) {
    const err = json.error_response as Record<string, unknown>;
    throw new AliExpressApiError(
      String(err.msg ?? "AliExpress error"),
      err.code ? String(err.code) : undefined,
      err.sub_msg ? String(err.sub_msg) : undefined
    );
  }

  const respKey = `${method.replace(/\./g, "_")}_response`;
  const inner = (json[respKey] ?? json) as Record<string, unknown>;
  return inner;
}

/** Digs into the common `resp_result.result` envelope; returns null if absent. */
export function unwrapResult(inner: Record<string, unknown>): Record<string, unknown> | null {
  const respResult = inner.resp_result as Record<string, unknown> | undefined;
  if (respResult) {
    const code = respResult.resp_code;
    if (code !== undefined && Number(code) !== 200) return null;
    return (respResult.result as Record<string, unknown>) ?? null;
  }
  // Some methods return result directly.
  return (inner.result as Record<string, unknown>) ?? null;
}
