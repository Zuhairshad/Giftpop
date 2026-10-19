import { describe, expect, it } from "vitest";

import { parseCountryParam } from "./country-param";

describe("parseCountryParam", () => {
  it("accepts upper and lower case codes", () => {
    expect(parseCountryParam("PK")).toBe("PK");
    expect(parseCountryParam("pk")).toBe("PK");
  });

  it.each(["", "P", "PAK", "p1", "build", "%20"])("rejects %j", (raw) => {
    expect(parseCountryParam(raw)).toBeNull();
  });
});
