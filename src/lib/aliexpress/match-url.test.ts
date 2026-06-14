import { describe, it, expect } from "vitest";
import { isAliExpressUrl, extractAliExpressUrl } from "./match-url";

describe("isAliExpressUrl", () => {
  it("accepts item, short and locale links", () => {
    expect(isAliExpressUrl("https://he.aliexpress.com/item/1005012266686199.html?x=1")).toBe(true);
    expect(isAliExpressUrl("https://s.click.aliexpress.com/e/_c3vZxcpP")).toBe(true);
    expect(isAliExpressUrl("https://a.aliexpress.com/_c3KC5Z3r")).toBe(true);
  });
  it("rejects non-aliexpress and junk", () => {
    expect(isAliExpressUrl("https://www.amazon.com/dp/B01")).toBe(false);
    expect(isAliExpressUrl("not a url")).toBe(false);
  });
});

describe("extractAliExpressUrl", () => {
  it("extracts a link embedded in prose", () => {
    const text = "check this https://he.aliexpress.com/item/123456789.html cool";
    expect(extractAliExpressUrl(text)).toBe("https://he.aliexpress.com/item/123456789.html");
  });
  it("returns null when no aliexpress link present", () => {
    expect(extractAliExpressUrl("see https://example.com/x")).toBeNull();
    expect(extractAliExpressUrl("")).toBeNull();
  });
});
