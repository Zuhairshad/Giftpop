import { describe, expect, it } from "vitest";

import { visibleCustomRequest } from "./gift-request";

describe("visibleCustomRequest", () => {
  it("hides an empty or blank request", () => {
    expect(visibleCustomRequest("")).toBeNull();
    expect(visibleCustomRequest("  \n ")).toBeNull();
    expect(visibleCustomRequest(undefined)).toBeNull();
  });

  it("shows a request, trimmed", () => {
    expect(visibleCustomRequest("  No nuts please ")).toBe("No nuts please");
  });
});
