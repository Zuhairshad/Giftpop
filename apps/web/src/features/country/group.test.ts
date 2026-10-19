import type { PublicCountry } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { groupCountries } from "./group";

function country(code: string, name: string, status: PublicCountry["status"]): PublicCountry {
  return {
    code,
    name,
    status,
    currency: "USD",
    paymentModes: ["prepaid"],
    shipping: { flatMinor: 0, deliveryDays: { min: 1, max: 2 } },
    addressFormat: {
      region: { required: false, label: "State" },
      postalCode: { required: false, label: "ZIP" },
    },
  };
}

describe("groupCountries", () => {
  it("separates live from coming soon and sorts by name", () => {
    const input = [
      country("TR", "Turkey", "coming_soon"),
      country("US", "United States", "live"),
      country("PK", "Pakistan", "live"),
      country("CN", "China", "coming_soon"),
    ];
    const result = groupCountries(input);
    expect(result.live.map((c) => c.code)).toEqual(["PK", "US"]);
    expect(result.comingSoon.map((c) => c.code)).toEqual(["CN", "TR"]);
    expect(input[0]?.code).toBe("TR");
  });
  it("handles an empty list", () => {
    expect(groupCountries([])).toEqual({ live: [], comingSoon: [] });
  });
});
