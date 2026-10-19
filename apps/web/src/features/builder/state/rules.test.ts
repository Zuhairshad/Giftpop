import { describe, expect, it } from "vitest";

import { emptyData } from "./data";
import type { BuilderData } from "./data";
import { addBlockedReason } from "./rules";
import {
  BOUQUET_ID,
  BOX_ID,
  CARD_ID,
  CHOC_ID,
  MUG_ID,
  SOAP_ID,
  TEDDY_ID,
  UNKNOWN_ID,
  makeCatalog,
} from "./test-fixtures";

function data(packagingId: string | null, lines: [string, number][] = []): BuilderData {
  return {
    ...emptyData(),
    packagingId,
    lines: lines.map(([itemId, qty], slot) => ({ itemId, qty, slot })),
  };
}

const catalog = makeCatalog();

describe("addBlockedReason", () => {
  it("is null when the item can be added", () => {
    expect(addBlockedReason(data(BOUQUET_ID), catalog, CARD_ID)).toBeNull();
    expect(addBlockedReason(data(BOUQUET_ID, [[CARD_ID, 1]]), catalog, CARD_ID)).toBeNull();
  });

  it("asks for a format first", () => {
    expect(addBlockedReason(data(null), catalog, CARD_ID)).toBe("Pick a format first");
  });

  it("names the country when the item is not sold there", () => {
    expect(addBlockedReason(data(BOUQUET_ID), catalog, UNKNOWN_ID)).toBe(
      "Not available in Pakistan",
    );
    expect(addBlockedReason(data(BOUQUET_ID), catalog, TEDDY_ID)).toBe("Not available in Pakistan");
  });

  it("says out of stock", () => {
    expect(addBlockedReason(data(BOUQUET_ID), catalog, SOAP_ID)).toBe("Out of stock");
  });

  it("uses the packaging name when it is full", () => {
    expect(addBlockedReason(data(BOUQUET_ID, [[CARD_ID, 4]]), catalog, CHOC_ID)).toBe(
      "Bouquet is full",
    );
    expect(addBlockedReason(data(BOX_ID, [[CARD_ID, 3]]), catalog, CARD_ID)).toBe(
      "Gift box is full",
    );
  });

  it("says no room left when the next unit would go over capacity", () => {
    // Bouquet holds 8 units; two mugs use 6, a third needs 3.
    const full = data(BOUQUET_ID, [[MUG_ID, 2]]);
    expect(addBlockedReason(full, catalog, MUG_ID)).toBe("Bouquet has no room left");
    expect(addBlockedReason(full, catalog, CHOC_ID)).toBeNull();
    expect(
      addBlockedReason(
        data(BOUQUET_ID, [
          [MUG_ID, 2],
          [CHOC_ID, 1],
        ]),
        catalog,
        CHOC_ID,
      ),
    ).toBe("Bouquet has no room left");
  });

  it("checks stock before room", () => {
    expect(addBlockedReason(data(BOUQUET_ID, [[CARD_ID, 4]]), catalog, SOAP_ID)).toBe(
      "Out of stock",
    );
  });

  it("falls back to the country code when the runtime has no name for it", () => {
    expect(addBlockedReason(data(BOUQUET_ID), { ...catalog, country: "ZZ" }, UNKNOWN_ID)).toMatch(
      /^Not available in /,
    );
  });
});
