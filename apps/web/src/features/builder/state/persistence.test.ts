import type { Design } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readStoredDesign, storageKey, writeStoredDesign } from "./persistence";
import type { StorageLike } from "./persistence";
import { createBuilderStore } from "./store";
import {
  BOUQUET_ID,
  BOX_ID,
  CARD_ID,
  CHOC_ID,
  UNKNOWN_ID,
  counterRandom,
  fakeStorage,
  makeCatalog,
  newTestStore,
} from "./test-fixtures";

const design: Design = {
  packagingId: BOUQUET_ID,
  items: [
    { itemId: CARD_ID, qty: 2, slot: 0 },
    { itemId: CHOC_ID, qty: 1, slot: 1 },
  ],
  wrapperColor: "#cc0000",
  ribbonColor: "#00aa00",
  arrangementSeed: 99,
  personalisation: { cardMessage: "Hi", customRequest: "", recipientName: "Sana", itemNames: { [CHOC_ID]: "Amna" } },
};

const throwing: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("quota exceeded");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("storageKey", () => {
  it("is per country", () => {
    expect(storageKey("PK")).toBe("gp-builder:PK");
    expect(storageKey("US")).toBe("gp-builder:US");
  });
});

describe("readStoredDesign and writeStoredDesign", () => {
  it("round-trips a design", () => {
    const storage = fakeStorage();
    writeStoredDesign(storage, "PK", design);
    expect(readStoredDesign(storage, "PK", makeCatalog())).toEqual(design);
    expect(readStoredDesign(storage, "US", makeCatalog())).toBeNull();
  });

  it("still loads a design saved before custom requests existed", () => {
    const storage = fakeStorage();
    const oldPersonalisation: Record<string, unknown> = { ...design.personalisation };
    delete oldPersonalisation.customRequest;
    storage.setItem(
      storageKey("PK"),
      JSON.stringify({ ...design, personalisation: oldPersonalisation }),
    );
    const read = readStoredDesign(storage, "PK", makeCatalog());
    expect(read?.personalisation.customRequest).toBe("");
    expect(read?.personalisation.cardMessage).toBe("Hi");
  });

  it("clears the key when written with no design", () => {
    const storage = fakeStorage();
    writeStoredDesign(storage, "PK", design);
    writeStoredDesign(storage, "PK", null);
    expect(storage.data.size).toBe(0);
  });

  it("returns null when nothing is stored or there is no storage", () => {
    expect(readStoredDesign(fakeStorage(), "PK", makeCatalog())).toBeNull();
    expect(readStoredDesign(null, "PK", makeCatalog())).toBeNull();
    expect(() => writeStoredDesign(null, "PK", design)).not.toThrow();
  });

  it("drops text that is not JSON", () => {
    const storage = fakeStorage({ "gp-builder:PK": "{not json" });
    expect(readStoredDesign(storage, "PK", makeCatalog())).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("drops JSON that is not a valid design", () => {
    const storage = fakeStorage({
      "gp-builder:PK": JSON.stringify({ ...design, arrangementSeed: -5 }),
    });
    expect(readStoredDesign(storage, "PK", makeCatalog())).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("drops a design whose packaging is no longer in the catalog", () => {
    const storage = fakeStorage({
      "gp-builder:PK": JSON.stringify({ ...design, packagingId: UNKNOWN_ID }),
    });
    expect(readStoredDesign(storage, "PK", makeCatalog())).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("drops a design with an item the catalog no longer has", () => {
    const storage = fakeStorage({
      "gp-builder:PK": JSON.stringify({
        ...design,
        items: [...design.items, { itemId: UNKNOWN_ID, qty: 1, slot: 2 }],
      }),
    });
    expect(readStoredDesign(storage, "PK", makeCatalog())).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("never throws when storage does", () => {
    expect(readStoredDesign(throwing, "PK", makeCatalog())).toBeNull();
    expect(() => writeStoredDesign(throwing, "PK", design)).not.toThrow();
    expect(() => writeStoredDesign(throwing, "PK", null)).not.toThrow();
  });
});

describe("persistence through the store", () => {
  it("saves after every change", () => {
    const { api, storage } = newTestStore();
    expect(storage.data.size).toBe(0);
    api().choosePackaging(BOUQUET_ID);
    const read = () => JSON.parse(storage.data.get("gp-builder:PK") ?? "null") as Design;
    expect(read().packagingId).toBe(BOUQUET_ID);
    api().addItem(CARD_ID);
    expect(read().items).toEqual([{ itemId: CARD_ID, qty: 1, slot: 0 }]);
    api().setCardMessage("Hello");
    expect(read().personalisation.cardMessage).toBe("Hello");
    api().setCustomRequest("A gold bow");
    expect(read().personalisation.customRequest).toBe("A gold bow");
    api().shuffle();
    expect(read().arrangementSeed).toBe(api().arrangementSeed);
  });

  it("restores a design when a new store hydrates, including the seed", () => {
    const first = newTestStore();
    first.api().choosePackaging(BOUQUET_ID);
    first.api().addItem(CHOC_ID);
    first.api().setItemName(CHOC_ID, "Amna");
    first.api().setWrapperColor("#cc0000");

    const second = newTestStore({ getStorage: () => first.storage });
    expect(second.api().packaging?.id).toBe(BOUQUET_ID);
    expect(second.api().lines).toEqual([{ itemId: CHOC_ID, qty: 1, slot: 0 }]);
    expect(second.api().itemNames).toEqual({ [CHOC_ID]: "Amna" });
    expect(second.api().wrapperColor).toBe("#cc0000");
    expect(second.api().arrangementSeed).toBe(first.api().arrangementSeed);
  });

  it("starts empty when the saved design is for something the catalog dropped", () => {
    const storage = fakeStorage({
      "gp-builder:PK": JSON.stringify({ ...design, packagingId: UNKNOWN_ID }),
    });
    const { api } = newTestStore({ getStorage: () => storage });
    expect(api().packaging).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it("works when storage throws on every call", () => {
    const { api } = newTestStore({ getStorage: () => throwing });
    expect(() => {
      api().choosePackaging(BOUQUET_ID);
      api().addItem(CARD_ID);
      api().addItem(CARD_ID);
      api().reset();
    }).not.toThrow();
    api().choosePackaging(BOUQUET_ID);
    expect(api().packaging?.id).toBe(BOUQUET_ID);
  });

  it("works when there is no storage at all", () => {
    const { api } = newTestStore({ getStorage: () => null });
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    expect(api().itemCount).toBe(1);
  });

  it("does not overwrite saved state before it has been read back", () => {
    const storage = fakeStorage({ "gp-builder:PK": JSON.stringify(design) });
    const store = createBuilderStore({
      country: "PK",
      catalog: makeCatalog(),
      fetchQuote: () => Promise.reject(new Error("no network in this test")),
      getStorage: () => storage,
      random: counterRandom(),
    });
    expect(store.isHydrated()).toBe(false);
    store.getSnapshot().choosePackaging(BOX_ID);
    expect(JSON.parse(storage.data.get("gp-builder:PK") ?? "null")).toEqual(design);
    store.hydrate();
    expect(store.isHydrated()).toBe(true);
    // The visitor already chose a format this session, so that wins over what was saved.
    expect(store.getSnapshot().packaging?.id).toBe(BOX_ID);
    expect(JSON.parse(storage.data.get("gp-builder:PK") ?? "null").packagingId).toBe(BOX_ID);
    store.dispose();
  });
});
