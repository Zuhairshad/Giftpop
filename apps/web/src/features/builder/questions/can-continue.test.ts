import { CARD_MESSAGE_MAX_LENGTH } from "@giftpop/contracts";
import type { DesignProblem } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOUQUET_ID, CHOC_ID, MUG_ID, CARD_ID, newTestStore } from "../state/test-fixtures";

import {
  coloursReady,
  itemsReady,
  layoutReady,
  packagingReady,
  personaliseReady,
  reviewReady,
} from "./can-continue";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const problem = (code: DesignProblem["code"]): DesignProblem => ({ code, message: code });

describe("packaging question", () => {
  it("continues once a packaging is chosen", () => {
    const { api } = newTestStore();
    expect(packagingReady(api())).toBe(false);
    api().choosePackaging(BOUQUET_ID);
    expect(packagingReady(api())).toBe(true);
  });
});

describe("colours question", () => {
  it("defaults both colours to the packaging's first colour, so it can continue", () => {
    const { api } = newTestStore();
    expect(coloursReady(api())).toBe(false);
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(api().wrapperColor).toBe(packaging.wrapperColors[0]!.hex);
    expect(api().ribbonColor).toBe(packaging.ribbonColors[0]!.hex);
    expect(coloursReady(api())).toBe(true);
  });

  it("keeps a colour the customer picked", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const second = api().packaging!.wrapperColors[1]!.hex;
    api().setWrapperColor(second);
    expect(api().wrapperColor).toBe(second);
    expect(coloursReady(api())).toBe(true);
  });
});

describe("items question", () => {
  it("needs a packaging", () => {
    expect(itemsReady({ packaging: null, problems: [] })).toBe(false);
  });

  it("is blocked below the minimum and open inside the range", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CHOC_ID);
    expect(itemsReady(api())).toBe(false);
    api().addItem(CARD_ID);
    expect(api().itemCount).toBeGreaterThanOrEqual(api().packaging!.minItems);
    expect(itemsReady(api())).toBe(true);
  });

  it("ignores a text-length problem but not any other", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(itemsReady({ packaging, problems: [problem("TEXT_TOO_LONG")] })).toBe(true);
    expect(itemsReady({ packaging, problems: [problem("TOO_FEW_ITEMS")] })).toBe(false);
    expect(
      itemsReady({ packaging, problems: [problem("TEXT_TOO_LONG"), problem("OVER_CAPACITY")] }),
    ).toBe(false);
  });
});

describe("layout question", () => {
  it("always continues", () => {
    expect(layoutReady()).toBe(true);
  });
});

describe("personalise question", () => {
  it("continues with everything empty", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    expect(personaliseReady(api())).toBe(true);
  });

  it("blocks only on a text-length problem", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(personaliseReady({ packaging, problems: [problem("TEXT_TOO_LONG")] })).toBe(false);
    expect(personaliseReady({ packaging, problems: [problem("TOO_FEW_ITEMS")] })).toBe(true);
  });

  it("never leaves the store over the card message limit", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().setCardMessage("x".repeat(CARD_MESSAGE_MAX_LENGTH + 50));
    expect(api().cardMessage).toHaveLength(CARD_MESSAGE_MAX_LENGTH);
    expect(personaliseReady(api())).toBe(true);
  });
});

describe("review question", () => {
  it("needs a design with no problems", () => {
    expect(reviewReady({ design: null, problems: [] })).toBe(false);
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    expect(reviewReady(api())).toBe(false);
    api().addItem(CHOC_ID);
    api().addItem(CARD_ID);
    api().addItem(MUG_ID);
    expect(api().problems).toEqual([]);
    expect(reviewReady(api())).toBe(true);
  });
});
