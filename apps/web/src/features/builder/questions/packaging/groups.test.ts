import type { PricedPackaging } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { FIXTURE_PACKAGINGS } from "../_dev/fixtures";

import { groupPackagings } from "./groups";

function withKind(priced: PricedPackaging, kind: string, n: number): PricedPackaging {
  return {
    ...priced,
    // A kind outside the contract can arrive from a newer API; the cast is the test's point.
    packaging: { ...priced.packaging, id: n.toString(16).padStart(24, "0"), kind: kind as "box" },
  };
}

describe("groupPackagings", () => {
  const base = FIXTURE_PACKAGINGS[1]!;

  it("orders groups by PACKAGING_KINDS, not by catalog order", () => {
    const groups = groupPackagings([
      withKind(base, "mug", 1),
      withKind(base, "box", 2),
      withKind(base, "bouquet", 3),
      withKind(base, "basket", 4),
      withKind(base, "other", 5),
    ]);
    expect(groups.map((g) => g.heading)).toEqual(["Boxes", "Bouquets", "Baskets", "Mugs", "More"]);
  });

  it("skips empty groups", () => {
    const groups = groupPackagings([withKind(base, "bouquet", 1), withKind(base, "mug", 2)]);
    expect(groups.map((g) => g.kind)).toEqual(["bouquet", "mug"]);
  });

  it("keeps the catalog order inside a group", () => {
    const first = withKind(base, "box", 1);
    const second = withKind(base, "box", 2);
    const [group] = groupPackagings([first, second]);
    expect(group?.packagings.map((p) => p.packaging.id)).toEqual([
      first.packaging.id,
      second.packaging.id,
    ]);
  });

  it("puts an unknown kind into More, after the known others", () => {
    const groups = groupPackagings([withKind(base, "hamper", 1), withKind(base, "other", 2)]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.kind).toBe("other");
    expect(groups[0]?.packagings).toHaveLength(2);
  });

  it("is empty for an empty list", () => {
    expect(groupPackagings([])).toEqual([]);
  });

  it("groups the fixture catalog into bouquets, boxes and baskets", () => {
    expect(groupPackagings(FIXTURE_PACKAGINGS).map((g) => g.heading)).toEqual([
      "Boxes",
      "Bouquets",
      "Baskets",
    ]);
  });
});
