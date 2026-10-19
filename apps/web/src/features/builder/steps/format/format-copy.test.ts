import { describe, expect, it } from "vitest";

import { FIXTURE_PACKAGINGS, fixtureCatalog, oid } from "../items/_dev/fixtures";

import {
  droppedItemNames,
  droppedItemsNotice,
  packagingAvailability,
  pickRangeCopy,
  visiblePackagings,
} from "./format-copy";
import { priceLabel } from "./price-label";

describe("pickRangeCopy", () => {
  it("says the range in plain words", () => {
    expect(pickRangeCopy(6, 10)).toBe("Pick 6 to 10");
    expect(pickRangeCopy(1, 3)).toBe("Pick 1 to 3");
  });

  it("says exactly when min and max are the same", () => {
    expect(pickRangeCopy(4, 4)).toBe("Pick exactly 4");
  });
});

describe("packagingAvailability", () => {
  const [bouquet, , , basket] = FIXTURE_PACKAGINGS;

  it("allows an active, in-stock packaging", () => {
    expect(packagingAvailability(bouquet!)).toEqual({ available: true, reason: null });
  });

  it("disables an out-of-stock packaging and says why", () => {
    expect(packagingAvailability(basket!)).toEqual({ available: false, reason: "Out of stock" });
  });

  it("disables an inactive packaging", () => {
    const inactive = { ...bouquet!, packaging: { ...bouquet!.packaging, active: false } };
    expect(packagingAvailability(inactive).available).toBe(false);
  });
});

describe("visiblePackagings", () => {
  it("keeps out-of-stock packagings visible and hides inactive ones", () => {
    const catalog = fixtureCatalog();
    const inactive = {
      ...FIXTURE_PACKAGINGS[0]!,
      packaging: { ...FIXTURE_PACKAGINGS[0]!.packaging, id: oid(99), active: false },
    };
    const shown = visiblePackagings({ packagings: [...catalog.packagings, inactive] });
    expect(shown).toHaveLength(FIXTURE_PACKAGINGS.length);
    expect(shown.some((p) => !p.inStock)).toBe(true);
  });

  it("is empty for an empty catalog", () => {
    expect(visiblePackagings({ packagings: [] })).toEqual([]);
  });
});

describe("dropped items notice", () => {
  const catalog = fixtureCatalog();

  it("maps ids to names and skips unknown ids", () => {
    expect(droppedItemNames([oid(101), oid(5000), oid(105)], catalog)).toEqual([
      "Rose",
      "Gummy jar",
    ]);
  });

  it("is null when nothing was dropped", () => {
    expect(droppedItemsNotice("Mini box", [])).toBeNull();
  });

  it("names one dropped item in the singular", () => {
    expect(droppedItemsNotice("Mini box", ["Rose"])).toBe(
      "Mini box could not fit everything, so 1 item was taken out: Rose.",
    );
  });

  it("lists several names and counts repeats", () => {
    expect(droppedItemsNotice("Mini box", ["Rose", "Rose", "Gummy jar"])).toBe(
      "Mini box could not fit everything, so 3 items were taken out: Rose (2), Gummy jar.",
    );
  });
});

describe("priceLabel", () => {
  it("formats minor units for display with the catalog currency", () => {
    expect(priceLabel(1500, "USD")).toBe("$15.00");
  });

  it("never rounds money into a float", () => {
    expect(priceLabel(5, "USD")).toBe("$0.05");
  });
});
