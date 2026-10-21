import { describe, expect, it } from "vitest";

import {
  clearReadyMadeStart,
  markReadyMadeStart,
  reviewActionLabel,
  startedFromReadyMade,
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

describe("ready-made origin", () => {
  it("is false until a ready-made gift is started", () => {
    expect(startedFromReadyMade("PK", memoryStore())).toBe(false);
  });

  it("remembers a start per country", () => {
    const store = memoryStore();
    markReadyMadeStart("PK", store);
    expect(startedFromReadyMade("PK", store)).toBe(true);
    expect(startedFromReadyMade("US", store)).toBe(false);
  });

  it("forgets it when the customer starts over", () => {
    const store = memoryStore();
    markReadyMadeStart("PK", store);
    clearReadyMadeStart("PK", store);
    expect(startedFromReadyMade("PK", store)).toBe(false);
  });

  it("falls back quietly when storage is blocked or missing", () => {
    expect(() => markReadyMadeStart("PK", THROWING)).not.toThrow();
    expect(() => clearReadyMadeStart("PK", THROWING)).not.toThrow();
    expect(startedFromReadyMade("PK", THROWING)).toBe(false);
    expect(startedFromReadyMade("PK", null)).toBe(false);
  });
});

describe("reviewActionLabel", () => {
  it("says what the button does for a ready-made gift", () => {
    expect(reviewActionLabel(true)).toBe("Order this gift");
  });

  it("keeps the usual label otherwise", () => {
    expect(reviewActionLabel(false)).toBe("Continue to checkout");
  });
});
