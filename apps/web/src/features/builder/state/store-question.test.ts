import type { Design } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionStorageKey, readStoredQuestion, writeStoredQuestion } from "./persistence";
import type { StorageLike } from "./persistence";
import { BOUQUET_ID, CARD_ID, CHOC_ID, fakeStorage, newTestStore } from "./test-fixtures";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const KEY = questionStorageKey("PK");

/** A bouquet with its two items, enough to reach every question. */
function fillBouquet(api: () => ReturnType<ReturnType<typeof newTestStore>["api"]>): void {
  api().choosePackaging(BOUQUET_ID);
  api().addItem(CARD_ID);
  api().addItem(CHOC_ID);
}

describe("question navigation", () => {
  it("starts on the first question", () => {
    const { api } = newTestStore();
    expect(api().question).toBe("packaging");
  });

  it("does not move on while the packaging is missing", () => {
    const { api } = newTestStore();
    api().nextQuestion();
    expect(api().question).toBe("packaging");
    api().goToQuestion("review");
    expect(api().question).toBe("packaging");
  });

  it("moves forward and back one question at a time", () => {
    const { api } = newTestStore();
    fillBouquet(api);
    api().nextQuestion();
    expect(api().question).toBe("colours");
    api().nextQuestion();
    expect(api().question).toBe("items");
    api().nextQuestion();
    expect(api().question).toBe("layout");
    api().previousQuestion();
    expect(api().question).toBe("items");
  });

  it("stops at both ends", () => {
    const { api } = newTestStore();
    api().previousQuestion();
    expect(api().question).toBe("packaging");
    fillBouquet(api);
    api().goToQuestion("review");
    expect(api().question).toBe("review");
    api().nextQuestion();
    expect(api().question).toBe("review");
  });

  it("cannot go past items before the minimum is picked", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().goToQuestion("items");
    api().nextQuestion();
    expect(api().question).toBe("items");
    api().goToQuestion("personalise");
    expect(api().question).toBe("items");
  });

  it("keeps the answers when going back", () => {
    const { api } = newTestStore();
    fillBouquet(api);
    api().goToQuestion("personalise");
    api().setCardMessage("Happy birthday");
    api().previousQuestion();
    api().previousQuestion();
    expect(api().cardMessage).toBe("Happy birthday");
    expect(api().itemCount).toBe(2);
  });

  it("moves the visitor back when their answers stop reaching the question", () => {
    const { api } = newTestStore();
    fillBouquet(api);
    api().goToQuestion("layout");
    api().removeItem(CHOC_ID);
    expect(api().question).toBe("items");
    // Adding the item back does not push them forward again.
    api().addItem(CHOC_ID);
    expect(api().question).toBe("items");
  });

  it("goes back to the first question after a reset", () => {
    const { api } = newTestStore();
    fillBouquet(api);
    api().goToQuestion("review");
    api().reset();
    expect(api().question).toBe("packaging");
  });

  it("notifies subscribers and keeps one snapshot until something changes", () => {
    const { store, api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const listener = vi.fn();
    store.subscribe(listener);
    const before = api();
    api().nextQuestion();
    expect(listener).toHaveBeenCalled();
    expect(api()).not.toBe(before);
    const after = api();
    api().goToQuestion("colours");
    expect(api()).toBe(after);
  });

  it("shows the first question to the server render", () => {
    const { store, api } = newTestStore();
    fillBouquet(api);
    api().goToQuestion("review");
    expect(store.getServerSnapshot().question).toBe("packaging");
  });
});

describe("question persistence", () => {
  it("saves the question when it changes and restores it for a new store", () => {
    const first = newTestStore();
    fillBouquet(first.api);
    first.api().goToQuestion("layout");
    expect(first.storage.data.get(KEY)).toBe("layout");

    const second = newTestStore({ getStorage: () => first.storage });
    expect(second.api().question).toBe("layout");
    expect(second.api().itemCount).toBe(2);
  });

  it("saves nothing until the visitor moves", () => {
    const { api, storage } = newTestStore();
    expect(storage.data.size).toBe(0);
    api().choosePackaging(BOUQUET_ID);
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("starts on the first question when the saved question has no design behind it", () => {
    const storage = fakeStorage({ [KEY]: "review" });
    const { api } = newTestStore({ getStorage: () => storage });
    expect(api().question).toBe("packaging");
    expect(storage.data.get(KEY)).toBe("packaging");
  });

  it("starts on the first question and forgets a value that is not a question", () => {
    const design: Design = {
      packagingId: BOUQUET_ID,
      items: [{ itemId: CARD_ID, qty: 2, slot: 0 }],
      wrapperColor: "#cc0000",
      ribbonColor: "#00aa00",
      arrangementSeed: 99,
      personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
    };
    const storage = fakeStorage({ "gp-builder:PK": JSON.stringify(design), [KEY]: "arrange" });
    const { api } = newTestStore({ getStorage: () => storage });
    expect(api().question).toBe("packaging");
    expect(api().packaging?.id).toBe(BOUQUET_ID);
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("falls back to an earlier question when the saved one is no longer reachable", () => {
    const first = newTestStore();
    first.api().choosePackaging(BOUQUET_ID);
    first.api().goToQuestion("items");
    first.storage.data.set(KEY, "review");

    const second = newTestStore({ getStorage: () => first.storage });
    expect(second.api().question).toBe("items");
  });

  it("keeps the question the visitor chose this session over the saved one", () => {
    const storage = fakeStorage({ [KEY]: "items" });
    const { api } = newTestStore({ getStorage: () => storage });
    api().choosePackaging(BOUQUET_ID);
    expect(api().question).toBe("packaging");
  });
});

describe("readStoredQuestion and writeStoredQuestion", () => {
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

  it("round-trips a question per country", () => {
    const storage = fakeStorage();
    writeStoredQuestion(storage, "PK", "items");
    expect(readStoredQuestion(storage, "PK")).toBe("items");
    expect(readStoredQuestion(storage, "AE")).toBeNull();
  });

  it("reads a missing or invalid value as null, and forgets the invalid one", () => {
    const storage = fakeStorage({ [KEY]: "<script>" });
    expect(readStoredQuestion(storage, "PK")).toBeNull();
    expect(storage.data.size).toBe(0);
    expect(readStoredQuestion(storage, "PK")).toBeNull();
    expect(readStoredQuestion(null, "PK")).toBeNull();
  });

  it("never throws when storage does", () => {
    expect(readStoredQuestion(throwing, "PK")).toBeNull();
    expect(() => writeStoredQuestion(throwing, "PK", "review")).not.toThrow();
    expect(() => writeStoredQuestion(null, "PK", "review")).not.toThrow();
  });

  it("keeps working when storage throws on every call", () => {
    const { api } = newTestStore({ getStorage: () => throwing });
    fillBouquet(api);
    api().goToQuestion("layout");
    expect(api().question).toBe("layout");
  });
});
