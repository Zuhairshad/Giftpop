import { describe, expect, it } from "vitest";

import { extractShareId } from "./share-link";

describe("extractShareId", () => {
  it("accepts a bare id", () => {
    expect(extractShareId("abc123XYZ_")).toBe("abc123XYZ_");
    expect(extractShareId("  abc123XYZ_  ")).toBe("abc123XYZ_");
  });
  it("accepts full links with or without trailing slash, query and hash", () => {
    expect(extractShareId("https://giftpop.test/g/abc123XYZ_")).toBe("abc123XYZ_");
    expect(extractShareId("https://giftpop.test/g/abc123XYZ_/")).toBe("abc123XYZ_");
    expect(extractShareId("http://localhost:3000/g/abc123XYZ_?utm=1#x")).toBe("abc123XYZ_");
  });
  it("rejects anything else", () => {
    for (const bad of [
      "",
      "   ",
      "short",
      "has spaces in it",
      "https://giftpop.test/x/abc123XYZ_",
      "https://giftpop.test/g/abc123XYZ_/extra",
      "https://giftpop.test/g/",
      "https://giftpop.test/g/bad id!",
      "ftp://giftpop.test/g/abc123XYZ_",
      "javascript:alert(1)",
      "/g/abc123XYZ_",
    ]) {
      expect(extractShareId(bad), bad).toBeNull();
    }
  });
});
