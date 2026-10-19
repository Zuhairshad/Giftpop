import { describe, expect, it } from "vitest";

import { blockedReasonFor } from "./fake-builder";
import { FIXTURE_ITEMS, FIXTURE_PACKAGINGS, fixtureCatalog, oid } from "./fixtures";

describe("fixtures and blocked reasons used by the dev page", () => {
  const catalog = fixtureCatalog();
  const bouquet = FIXTURE_PACKAGINGS[0]!.packaging;
  const entry = (n: number) => FIXTURE_ITEMS.find((e) => e.item.id === oid(100 + n));

  it("allows an in-stock item with room", () => {
    expect(blockedReasonFor(catalog, bouquet, [], entry(1))).toBeNull();
  });

  it("blocks out-of-stock items", () => {
    expect(blockedReasonFor(catalog, bouquet, [], entry(6))).toBe("Out of stock");
  });

  it("blocks unknown items", () => {
    expect(blockedReasonFor(catalog, bouquet, [], undefined)).toBe("Not available in PK");
  });

  it("blocks when the count is full", () => {
    const lines = [{ itemId: oid(101), qty: 7, slot: 0 }];
    expect(blockedReasonFor(catalog, bouquet, lines, entry(2))).toBe("Box is full");
  });

  it("blocks when the next item does not fit the space left", () => {
    const lines = [{ itemId: oid(107), qty: 3, slot: 0 }];
    expect(blockedReasonFor(catalog, bouquet, lines, entry(7))).toBe("Box is full");
  });
});
