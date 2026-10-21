import type { Design } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { describeGiftChanges, giftChangeLines, splitUnsold, unsoldNote } from "./gift-changes";

const PACK = "aaaaaaaaaaaaaaaaaaaaaaaa";
const A = "bbbbbbbbbbbbbbbbbbbbbbbb";
const B = "cccccccccccccccccccccccc";
const C = "dddddddddddddddddddddddd";

function design(over: Partial<Design> = {}): Design {
  return {
    packagingId: PACK,
    items: [
      { itemId: A, qty: 2, slot: 0 },
      { itemId: B, qty: 1, slot: 1 },
    ],
    wrapperColor: "#ffd3e0",
    ribbonColor: "#e8336d",
    arrangementSeed: 1,
    personalisation: {
      cardMessage: "",
      recipientName: "",
      customRequest: "",
      itemNames: {},
    },
    ...over,
  };
}

describe("describeGiftChanges", () => {
  it("says nothing changed for the same design", () => {
    expect(describeGiftChanges(design(), design())).toEqual({
      changed: false,
      packagingChanged: false,
      added: [],
      removed: [],
      qty: [],
      wrapperChanged: false,
      ribbonChanged: false,
    });
  });

  it("ignores the card, names, slots and arrangement: those are not the gift", () => {
    const current = design({
      items: [
        { itemId: B, qty: 1, slot: 0 },
        { itemId: A, qty: 2, slot: 1 },
      ],
      arrangementSeed: 99,
      personalisation: {
        cardMessage: "Happy birthday",
        recipientName: "Sana",
        customRequest: "",
        itemNames: { [A]: "Sana" },
      },
    });
    expect(describeGiftChanges(design(), current).changed).toBe(false);
  });

  it("lists an added item and a removed item", () => {
    const current = design({
      items: [
        { itemId: A, qty: 2, slot: 0 },
        { itemId: C, qty: 1, slot: 1 },
      ],
    });
    const changes = describeGiftChanges(design(), current);
    expect(changes).toMatchObject({ changed: true, added: [C], removed: [B], qty: [] });
  });

  it("lists a quantity change with the old and new quantity", () => {
    const current = design({
      items: [
        { itemId: A, qty: 3, slot: 0 },
        { itemId: B, qty: 1, slot: 1 },
      ],
    });
    expect(describeGiftChanges(design(), current).qty).toEqual([{ itemId: A, from: 2, to: 3 }]);
  });

  it("notices a different packaging and different colours", () => {
    const changes = describeGiftChanges(
      design(),
      design({
        packagingId: "eeeeeeeeeeeeeeeeeeeeeeee",
        wrapperColor: "#000000",
        ribbonColor: "#111111",
      }),
    );
    expect(changes).toMatchObject({
      changed: true,
      packagingChanged: true,
      wrapperChanged: true,
      ribbonChanged: true,
    });
  });

  it("compares colours without regard to case or spaces", () => {
    expect(describeGiftChanges(design(), design({ wrapperColor: " #FFD3E0 " })).changed).toBe(
      false,
    );
  });

  it("counts an item the customer took out as a change (for example one that sold out)", () => {
    const current = design({ items: [{ itemId: A, qty: 2, slot: 0 }] });
    expect(describeGiftChanges(design(), current)).toMatchObject({ changed: true, removed: [B] });
  });
});

describe("giftChangeLines", () => {
  const names: Record<string, string> = { [A]: "Pink rose", [B]: "Greeting card", [C]: "Candle" };
  const nameOf = (id: string) => names[id] ?? "An item that is no longer sold";

  it("has no lines for an unchanged gift", () => {
    expect(giftChangeLines(describeGiftChanges(design(), design()), nameOf)).toEqual([]);
  });

  it("writes one plain line per change, packaging first", () => {
    const current = design({
      packagingId: "eeeeeeeeeeeeeeeeeeeeeeee",
      items: [
        { itemId: A, qty: 3, slot: 0 },
        { itemId: C, qty: 1, slot: 1 },
      ],
      ribbonColor: "#000000",
    });
    expect(giftChangeLines(describeGiftChanges(design(), current), nameOf)).toEqual([
      "Different packaging",
      "Added: Candle",
      "Removed: Greeting card",
      "Pink rose: 2 to 3",
      "Different ribbon colour",
    ]);
  });

  it("falls back for an item the catalog does not list", () => {
    const current = design({ items: [{ itemId: "ffffffffffffffffffffffff", qty: 1, slot: 0 }] });
    expect(giftChangeLines(describeGiftChanges(design(), current), nameOf)).toContain(
      "Added: An item that is no longer sold",
    );
  });
});

describe("splitUnsold", () => {
  it("keeps the whole design when every item is still sold", () => {
    const { sold, unsold } = splitUnsold(design(), () => true);
    expect(sold).toEqual(design());
    expect(unsold).toEqual([]);
  });

  it("takes out items that are no longer sold and lists them", () => {
    const { sold, unsold } = splitUnsold(design(), (id) => id !== B);
    expect(sold.items).toEqual([{ itemId: A, qty: 2, slot: 0 }]);
    expect(unsold).toEqual([B]);
  });

  it("is what the builder loads, so an untouched gift is not 'changed' when an item sold out", () => {
    const loaded = design({ items: [{ itemId: A, qty: 2, slot: 0 }] });
    const { sold } = splitUnsold(design(), (id) => id !== B);
    expect(describeGiftChanges(sold, loaded).changed).toBe(false);
  });
});

describe("unsoldNote", () => {
  it("says nothing when no item was left out", () => {
    expect(unsoldNote(0)).toBeNull();
  });
  it("counts the items that were left out", () => {
    expect(unsoldNote(1)).toBe("1 item in this gift is no longer sold, so it was left out.");
    expect(unsoldNote(3)).toBe("3 items in this gift are no longer sold, so they were left out.");
  });
});
