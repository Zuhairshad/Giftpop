import { describe, expect, it } from "vitest";

import {
  clearReadyMadeStart,
  parseReadyMadeOrigin,
  readyMadeOrigin,
  rememberReadyMade,
  reviewActionLabel,
  type ReadyMadeOrigin,
} from "./ready-made-origin";

function memoryStore(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const THROWING = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

const ORIGIN: ReadyMadeOrigin = {
  shareId: "gift-bday-choc-bouquet",
  title: "Birthday chocolate bouquet",
  design: {
    packagingId: "aaaaaaaaaaaaaaaaaaaaaaaa",
    items: [{ itemId: "bbbbbbbbbbbbbbbbbbbbbbbb", qty: 2, slot: 0 }],
    wrapperColor: "#ffd3e0",
    ribbonColor: "#e8336d",
    arrangementSeed: 1,
    personalisation: { cardMessage: "", recipientName: "", customRequest: "", itemNames: {} },
  },
};

describe("ready-made origin", () => {
  it("is null until a ready-made gift is loaded", () => {
    expect(readyMadeOrigin("PK", memoryStore())).toBeNull();
  });

  it("remembers the gift's name and design, per country", () => {
    const store = memoryStore();
    rememberReadyMade("PK", ORIGIN, store);
    expect(readyMadeOrigin("PK", store)).toEqual(ORIGIN);
    expect(readyMadeOrigin("US", store)).toBeNull();
  });

  it("is forgotten once cleared", () => {
    const store = memoryStore();
    rememberReadyMade("PK", ORIGIN, store);
    clearReadyMadeStart("PK", store);
    expect(readyMadeOrigin("PK", store)).toBeNull();
  });

  it("reads anything that is not a valid origin as none (the old flag, junk, a bad design)", () => {
    expect(parseReadyMadeOrigin("1")).toBeNull();
    expect(parseReadyMadeOrigin("{not json")).toBeNull();
    expect(
      parseReadyMadeOrigin(JSON.stringify({ ...ORIGIN, design: { packagingId: 1 } })),
    ).toBeNull();
    expect(parseReadyMadeOrigin(null)).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    expect(() => rememberReadyMade("PK", ORIGIN, THROWING)).not.toThrow();
    expect(() => clearReadyMadeStart("PK", THROWING)).not.toThrow();
    expect(readyMadeOrigin("PK", THROWING)).toBeNull();
    expect(readyMadeOrigin("PK", null)).toBeNull();
  });
});

describe("reviewActionLabel", () => {
  it("says Order this gift for a ready-made start", () => {
    expect(reviewActionLabel(true)).toBe("Order this gift");
  });
  it("keeps Continue to checkout otherwise", () => {
    expect(reviewActionLabel(false)).toBe("Continue to checkout");
  });
});
