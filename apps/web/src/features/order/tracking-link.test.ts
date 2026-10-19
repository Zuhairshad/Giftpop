import { describe, expect, it } from "vitest";

import { safeTrackingUrl } from "./tracking-link";

describe("safeTrackingUrl", () => {
  it("allows http and https", () => {
    expect(safeTrackingUrl("https://courier.test/t/1")).toBe("https://courier.test/t/1");
    expect(safeTrackingUrl("http://courier.test/t/1")).toBe("http://courier.test/t/1");
  });
  it("rejects other schemes, junk and empty", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://x.test",
      "not a url",
      "",
      undefined,
    ]) {
      expect(safeTrackingUrl(url)).toBeNull();
    }
  });
});
