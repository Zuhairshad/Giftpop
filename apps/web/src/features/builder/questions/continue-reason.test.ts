import type { DesignProblem } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOUQUET_ID, CARD_ID, CHOC_ID, MUG_ID, newTestStore } from "../state/test-fixtures";

import {
  FIX_PROBLEMS_FIRST,
  PICK_COLOURS_FIRST,
  PICK_PACKAGING_FIRST,
  coloursCheck,
  itemsCheck,
  layoutCheck,
  packagingCheck,
  personaliseCheck,
  reviewCheck,
} from "./continue-reason";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const problem = (code: DesignProblem["code"], message: string): DesignProblem => ({
  code,
  message,
});

describe("continue reasons", () => {
  it("asks for a packaging until one is chosen, then has no reason", () => {
    const { api } = newTestStore();
    expect(packagingCheck(api())).toEqual({ ready: false, reason: PICK_PACKAGING_FIRST });
    api().choosePackaging(BOUQUET_ID);
    expect(packagingCheck(api())).toEqual({ ready: true, reason: null });
  });

  it("asks for colours only once a packaging exists", () => {
    const base = { wrapperColor: null, ribbonColor: null };
    expect(coloursCheck({ ...base, packaging: null }).reason).toBe(PICK_PACKAGING_FIRST);
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(coloursCheck({ ...base, packaging })).toEqual({
      ready: false,
      reason: PICK_COLOURS_FIRST,
    });
    expect(coloursCheck(api()).ready).toBe(true);
  });

  it("gives the first count problem on the items question, ignoring text limits", () => {
    const { api } = newTestStore();
    expect(itemsCheck(api()).reason).toBe(PICK_PACKAGING_FIRST);
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(
      itemsCheck({
        packaging,
        problems: [problem("TEXT_TOO_LONG", "long"), problem("TOO_FEW_ITEMS", "Pick at least 6")],
      }),
    ).toEqual({ ready: false, reason: "Pick at least 6" });
    expect(itemsCheck({ packaging, problems: [problem("TEXT_TOO_LONG", "long")] }).ready).toBe(
      true,
    );
  });

  it("reads the real store's count message", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CHOC_ID);
    const check = itemsCheck(api());
    expect(check.ready).toBe(false);
    expect(check.reason).toMatch(/^Pick at least \d+ items/);
  });

  it("never blocks the layout question", () => {
    expect(layoutCheck()).toEqual({ ready: true, reason: null });
  });

  it("names the text that is too long on the personalise question", () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    const packaging = api().packaging!;
    expect(
      personaliseCheck({
        packaging,
        problems: [problem("TOO_FEW_ITEMS", "few"), problem("TEXT_TOO_LONG", "Card too long")],
      }),
    ).toEqual({ ready: false, reason: "Card too long" });
    expect(personaliseCheck({ packaging, problems: [problem("TOO_FEW_ITEMS", "few")] }).ready).toBe(
      true,
    );
    expect(personaliseCheck({ packaging: null, problems: [] }).reason).toBe(PICK_PACKAGING_FIRST);
  });

  it("points at the problem list on review", () => {
    expect(reviewCheck({ design: null, problems: [] }).reason).toBe(PICK_PACKAGING_FIRST);
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    expect(reviewCheck(api())).toEqual({ ready: false, reason: FIX_PROBLEMS_FIRST });
    api().addItem(CHOC_ID);
    api().addItem(CARD_ID);
    api().addItem(MUG_ID);
    expect(reviewCheck(api())).toEqual({ ready: true, reason: null });
  });
});
