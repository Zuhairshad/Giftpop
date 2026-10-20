import {
  CARD_MESSAGE_MAX_LENGTH,
  CUSTOM_REQUEST_MAX_LENGTH,
  ITEM_NAME_MAX_LENGTH,
  RECIPIENT_NAME_MAX_LENGTH,
} from "@giftpop/contracts";
import type { Design } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BOUQUET_ID,
  BOX_ID,
  CARD_ID,
  CHOC_ID,
  INACTIVE_PACKAGING_ID,
  MUG_ID,
  SOAP_ID,
  TEDDY_ID,
  UNKNOWN_ID,
  newTestStore,
} from "./test-fixtures";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("initial state", () => {
  it("is empty with no design, no problems and a fixed seed", () => {
    const { api } = newTestStore();
    expect(api().packaging).toBeNull();
    expect(api().design).toBeNull();
    expect(api().problems).toEqual([]);
    expect(api().lines).toEqual([]);
    expect(api().itemCount).toBe(0);
    expect(api().usedUnits).toBe(0);
    expect(api().wrapperColor).toBeNull();
    expect(api().arrangementSeed).toBe(1);
    expect(api().quote).toBeNull();
    expect(api().quoteStatus).toBe("idle");
  });

  it("gives the same snapshot object until something changes", () => {
    const { api } = newTestStore();
    const first = api();
    expect(api()).toBe(first);
    first.choosePackaging(BOUQUET_ID);
    expect(api()).not.toBe(first);
    expect(api().design).toBe(api().design);
  });

  it("notifies subscribers on change", () => {
    const { store, api } = newTestStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    api().choosePackaging(BOUQUET_ID);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    api().addItem(CARD_ID);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("choosePackaging", () => {
  it("builds a design with the first colours and a random seed from the action", () => {
    const { api } = newTestStore();
    const result = api().choosePackaging(BOUQUET_ID);
    expect(result).toEqual({ droppedItemIds: [] });
    expect(api().packaging?.name).toBe("Bouquet");
    expect(api().design).toMatchObject({
      packagingId: BOUQUET_ID,
      items: [],
      wrapperColor: "#fff8e7",
      ribbonColor: "#d4af37",
      arrangementSeed: 100,
    });
    expect(api().wrapperColor).toBe("#fff8e7");
    expect(api().ribbonColor).toBe("#d4af37");
  });

  it("keeps the seed and personalisation when the format changes", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setCardMessage("Happy birthday");
    api().setRecipientName("Sana");
    api().choosePackaging(BOX_ID);
    expect(api().arrangementSeed).toBe(100);
    expect(api().cardMessage).toBe("Happy birthday");
    expect(api().recipientName).toBe("Sana");
  });

  it("ignores an unknown or inactive packaging", () => {
    const { api } = newTestStore();
    expect(api().choosePackaging(UNKNOWN_ID)).toEqual({ droppedItemIds: [] });
    expect(api().packaging).toBeNull();
    expect(api().choosePackaging(INACTIVE_PACKAGING_ID)).toEqual({ droppedItemIds: [] });
    expect(api().packaging).toBeNull();
    expect(api().arrangementSeed).toBe(1);
  });

  it("drops what does not fit from the end and returns the dropped ids", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setQty(CHOC_ID, 2); // 2 items, 4 units
    api().addItem(MUG_ID); // 3 items, 7 units
    api().addItem(CARD_ID); // 4 items, 8 units
    api().setItemName(CHOC_ID, "Sana");
    expect(api().itemCount).toBe(4);

    const result = api().choosePackaging(BOX_ID); // max 3 items, capacity 5
    expect(result.droppedItemIds).toEqual([MUG_ID, CARD_ID]);
    expect(api().lines).toEqual([{ itemId: CHOC_ID, qty: 2, slot: 0 }]);
    expect(api().itemNames).toEqual({ [CHOC_ID]: "Sana" });
    expect(api().usedUnits).toBe(4);
  });

  it("stops at the first line that does not fit; later smaller items are dropped too", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(MUG_ID); // 3 units
    api().addItem(MUG_ID); // 6 units
    api().addItem(CARD_ID); // 7 units
    const result = api().choosePackaging(BOX_ID); // capacity 5
    expect(result.droppedItemIds).toEqual([MUG_ID, CARD_ID]);
    expect(api().lines).toEqual([{ itemId: MUG_ID, qty: 1, slot: 0 }]);
  });

  it("reduces a line to what fits when only part of it is over", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setQty(CHOC_ID, 3); // 6 units
    const result = api().choosePackaging(BOX_ID); // capacity 5 => 2 chocolates
    expect(result.droppedItemIds).toEqual([CHOC_ID]);
    expect(api().lines).toEqual([{ itemId: CHOC_ID, qty: 2, slot: 0 }]);
  });

  it("drops the names of dropped items", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(MUG_ID);
    api().addItem(CARD_ID);
    api().setQty(CHOC_ID, 2);
    api().setItemName(CHOC_ID, "Sana");
    const result = api().choosePackaging(BOX_ID); // the chocolates no longer fit at all
    expect(result.droppedItemIds).toEqual([CHOC_ID]);
    expect(api().lines).toEqual([
      { itemId: MUG_ID, qty: 1, slot: 0 },
      { itemId: CARD_ID, qty: 1, slot: 1 },
    ]);
    expect(api().itemNames).toEqual({});
  });

  it("resets colours the new packaging does not offer and keeps ones it does", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setWrapperColor("#cc0000");
    api().setRibbonColor("#00aa00");
    api().choosePackaging(BOX_ID);
    expect(api().wrapperColor).toBe("#0000ff");
    // Same colour, different letter case: kept, as the box spells it.
    expect(api().ribbonColor).toBe("#00AA00");
  });

  it("drops an item the catalog no longer sells", () => {
    const { api, store } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    const catalog = api().catalog;
    store.setCatalog({ ...catalog, items: catalog.items.filter((e) => e.item.id !== CARD_ID) });
    expect(api().choosePackaging(BOX_ID).droppedItemIds).toEqual([CARD_ID]);
    expect(api().lines).toEqual([]);
  });
});

describe("items", () => {
  it("adds, increments and removes one unit at a time", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CHOC_ID);
    api().addItem(CARD_ID);
    expect(api().lines).toEqual([
      { itemId: CARD_ID, qty: 2, slot: 0 },
      { itemId: CHOC_ID, qty: 1, slot: 1 },
    ]);
    expect(api().itemCount).toBe(3);
    expect(api().usedUnits).toBe(4);

    api().removeItem(CARD_ID);
    expect(api().lines[0]).toEqual({ itemId: CARD_ID, qty: 1, slot: 0 });
    api().removeItem(CARD_ID);
    expect(api().lines).toEqual([{ itemId: CHOC_ID, qty: 1, slot: 0 }]);
    api().removeItem(CARD_ID);
    expect(api().lines).toHaveLength(1);
  });

  it("removing a line also removes the name on it", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CHOC_ID);
    api().setItemName(CHOC_ID, "Sana");
    api().removeItem(CHOC_ID);
    expect(api().itemNames).toEqual({});
  });

  it("does nothing before a format is chosen", () => {
    const { api } = newTestStore();
    api().addItem(CARD_ID);
    expect(api().lines).toEqual([]);
  });

  it("does not add items that are blocked", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(SOAP_ID);
    api().addItem(TEDDY_ID);
    api().addItem(UNKNOWN_ID);
    expect(api().lines).toEqual([]);
  });

  it("stops adding at the max item count", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    for (let i = 0; i < 6; i += 1) api().addItem(CARD_ID);
    expect(api().itemCount).toBe(4);
    expect(api().addBlockedReason(CARD_ID)).toBe("Bouquet is full");
  });

  it("stops adding when capacity would be exceeded", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(MUG_ID);
    api().addItem(MUG_ID); // 6 of 8 units
    api().addItem(MUG_ID);
    expect(api().itemCount).toBe(2);
    expect(api().addBlockedReason(MUG_ID)).toBe("Bouquet has no room left");
    expect(api().addBlockedReason(CARD_ID)).toBeNull();
  });

  it("setQty sets, clamps to what fits, removes at 0 and ignores bad input", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setQty(CARD_ID, 2);
    expect(api().lines).toEqual([{ itemId: CARD_ID, qty: 2, slot: 0 }]);
    api().setQty(CARD_ID, 99);
    expect(api().lines[0]?.qty).toBe(4);
    api().setQty(CARD_ID, 2.9);
    expect(api().lines[0]?.qty).toBe(2);
    api().setQty(CARD_ID, Number.NaN);
    expect(api().lines[0]?.qty).toBe(2);
    api().setQty(CARD_ID, -3);
    expect(api().lines).toEqual([]);
  });

  it("setQty can lower the quantity of an item that has gone out of stock but not raise it", () => {
    const { api, store } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setQty(CARD_ID, 3);
    const catalog = api().catalog;
    store.setCatalog({
      ...catalog,
      items: catalog.items.map((e) => (e.item.id === CARD_ID ? { ...e, inStock: false } : e)),
    });
    api().setQty(CARD_ID, 4);
    expect(api().lines[0]?.qty).toBe(3);
    api().setQty(CARD_ID, 1);
    expect(api().lines[0]?.qty).toBe(1);
  });

  it("moveItem reorders and renumbers slots", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CHOC_ID);
    api().addItem(MUG_ID);
    api().moveItem(0, 2);
    expect(api().lines).toEqual([
      { itemId: CHOC_ID, qty: 1, slot: 0 },
      { itemId: MUG_ID, qty: 1, slot: 1 },
      { itemId: CARD_ID, qty: 1, slot: 2 },
    ]);
    api().moveItem(2, 0);
    expect(api().lines.map((l) => l.itemId)).toEqual([CARD_ID, CHOC_ID, MUG_ID]);
    expect(api().design?.items.map((i) => i.slot)).toEqual([0, 1, 2]);
  });

  it("moveItem ignores positions that do not exist", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CHOC_ID);
    const before = api().lines;
    api().moveItem(0, 5);
    api().moveItem(-1, 0);
    api().moveItem(1, 1);
    api().moveItem(0.5, 1);
    expect(api().lines).toBe(before);
  });
});

describe("arrangement and colours", () => {
  it("shuffle makes a new seed, even when the source repeats itself", () => {
    const { api } = newTestStore({ random: () => 7 });
    api().choosePackaging(BOUQUET_ID);
    expect(api().arrangementSeed).toBe(7);
    api().shuffle();
    expect(api().arrangementSeed).toBe(7);

    const counter = newTestStore();
    counter.api().choosePackaging(BOUQUET_ID);
    counter.api().shuffle();
    expect(counter.api().arrangementSeed).toBe(101);
    expect(counter.api().design?.arrangementSeed).toBe(101);
  });

  it("sets colours the packaging offers and ignores others", () => {
    const { api } = newTestStore();
    api().setWrapperColor("#cc0000");
    expect(api().wrapperColor).toBeNull();
    api().choosePackaging(BOUQUET_ID);
    api().setWrapperColor("#CC0000");
    expect(api().wrapperColor).toBe("#cc0000");
    api().setRibbonColor("#00aa00");
    expect(api().ribbonColor).toBe("#00aa00");
    api().setWrapperColor("#123456");
    api().setRibbonColor("#123456");
    expect(api().wrapperColor).toBe("#cc0000");
    expect(api().ribbonColor).toBe("#00aa00");
    expect(api().design).toMatchObject({ wrapperColor: "#cc0000", ribbonColor: "#00aa00" });
  });
});

describe("text", () => {
  it("keeps a custom request, cuts it at the limit and puts it in the design", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    expect(api().customRequest).toBe("");
    api().setCustomRequest("r".repeat(CUSTOM_REQUEST_MAX_LENGTH + 20));
    expect(api().customRequest).toHaveLength(CUSTOM_REQUEST_MAX_LENGTH);
    expect(api().design?.personalisation.customRequest).toHaveLength(CUSTOM_REQUEST_MAX_LENGTH);
    expect(api().problems).not.toContainEqual(expect.objectContaining({ code: "TEXT_TOO_LONG" }));
  });

  it("cuts the card message and recipient name at the contract limits", () => {
    const { api } = newTestStore();
    api().setCardMessage("x".repeat(CARD_MESSAGE_MAX_LENGTH + 50));
    api().setRecipientName("y".repeat(RECIPIENT_NAME_MAX_LENGTH + 5));
    expect(api().cardMessage).toHaveLength(CARD_MESSAGE_MAX_LENGTH);
    expect(api().recipientName).toHaveLength(RECIPIENT_NAME_MAX_LENGTH);
    api().choosePackaging(BOUQUET_ID);
    expect(api().design?.personalisation.cardMessage).toHaveLength(CARD_MESSAGE_MAX_LENGTH);
    expect(api().problems).not.toContainEqual(expect.objectContaining({ code: "TEXT_TOO_LONG" }));
  });

  it("does not leave half an emoji at the cut", () => {
    const { api } = newTestStore();
    api().setRecipientName("a".repeat(RECIPIENT_NAME_MAX_LENGTH - 1) + "\u{1F381}");
    expect(api().recipientName).toBe("a".repeat(RECIPIENT_NAME_MAX_LENGTH - 1));
  });

  it("cuts an item name at that item's own limit", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CHOC_ID);
    api().setItemName(CHOC_ID, "abcdefghijklmnop");
    expect(api().itemNames[CHOC_ID]).toBe("abcdefghij");
    expect("abcdefghij".length).toBeLessThanOrEqual(ITEM_NAME_MAX_LENGTH);
    expect(api().design?.personalisation.itemNames).toEqual({ [CHOC_ID]: "abcdefghij" });
  });

  it("ignores names on items that cannot be named or are not in the gift", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(MUG_ID);
    api().setItemName(MUG_ID, "Sana");
    api().setItemName(CHOC_ID, "Sana");
    expect(api().itemNames).toEqual({});
  });

  it("clears a name when set to an empty string", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CHOC_ID);
    api().setItemName(CHOC_ID, "Sana");
    api().setItemName(CHOC_ID, "");
    expect(api().itemNames).toEqual({});
  });
});

describe("problems", () => {
  it("matches validateDesign for the current design", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    expect(api().problems.map((p) => p.code)).toEqual(["TOO_FEW_ITEMS"]);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    expect(api().problems).toEqual([]);
  });
});

describe("loadDesign", () => {
  function saved(overrides: Partial<Design> = {}): Design {
    return {
      packagingId: BOX_ID,
      items: [
        { itemId: MUG_ID, qty: 1, slot: 5 },
        { itemId: UNKNOWN_ID, qty: 2, slot: 2 },
        { itemId: CHOC_ID, qty: 2, slot: 3 },
      ],
      wrapperColor: "#0000ff",
      ribbonColor: "#111111",
      arrangementSeed: 4242,
      personalisation: {
        cardMessage: "Hi",
        customRequest: "Gold foil",
        recipientName: "Sana",
        itemNames: { [CHOC_ID]: "Amna", [UNKNOWN_ID]: "Ghost" },
      },
      ...overrides,
    };
  }

  it("replaces everything, orders by slot, renumbers and ignores unknown items", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().setCardMessage("old");
    api().loadDesign(saved());
    expect(api().packaging?.id).toBe(BOX_ID);
    expect(api().lines).toEqual([
      { itemId: CHOC_ID, qty: 2, slot: 0 },
      { itemId: MUG_ID, qty: 1, slot: 1 },
    ]);
    expect(api().arrangementSeed).toBe(4242);
    expect(api().wrapperColor).toBe("#0000ff");
    expect(api().ribbonColor).toBe("#111111");
    expect(api().cardMessage).toBe("Hi");
    expect(api().recipientName).toBe("Sana");
    expect(api().itemNames).toEqual({ [CHOC_ID]: "Amna" });
  });

  it("gives an empty builder when the packaging is unknown", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().loadDesign(saved({ packagingId: UNKNOWN_ID }));
    expect(api().packaging).toBeNull();
    expect(api().lines).toEqual([]);
  });

  it("truncates text that is over the limits", () => {
    const { api } = newTestStore();
    api().loadDesign(
      saved({
        personalisation: {
          cardMessage: "x".repeat(300),
          customRequest: "r".repeat(900),
          recipientName: "y".repeat(90),
          itemNames: { [CHOC_ID]: "z".repeat(40) },
        },
      }),
    );
    expect(api().cardMessage).toHaveLength(CARD_MESSAGE_MAX_LENGTH);
    expect(api().recipientName).toHaveLength(RECIPIENT_NAME_MAX_LENGTH);
    expect(api().itemNames[CHOC_ID]).toHaveLength(10);
  });
});

describe("reset", () => {
  it("clears everything, including what was saved", () => {
    const { api, storage } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().setCardMessage("Hi");
    expect(storage.data.has("gp-builder:PK")).toBe(true);
    api().reset();
    expect(api().packaging).toBeNull();
    expect(api().lines).toEqual([]);
    expect(api().cardMessage).toBe("");
    expect(api().arrangementSeed).toBe(1);
    expect(storage.data.has("gp-builder:PK")).toBe(false);
  });

  it("makes a new random seed when a format is chosen again", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().reset();
    api().choosePackaging(BOUQUET_ID);
    expect(api().arrangementSeed).toBe(101);
  });
});
