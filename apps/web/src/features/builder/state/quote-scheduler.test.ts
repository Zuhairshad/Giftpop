import type { Design, QuoteRequest, QuoteResponse } from "@giftpop/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createQuoteScheduler } from "./quote-scheduler";
import type { QuoteInput, QuoteUpdate } from "./quote-scheduler";
import { BOUQUET_ID, CARD_ID, makeQuoteResponse } from "./test-fixtures";

function design(qty = 2, seed = 5): Design {
  return {
    packagingId: BOUQUET_ID,
    items: [{ itemId: CARD_ID, qty, slot: 0 }],
    wrapperColor: "#fff8e7",
    ribbonColor: "#d4af37",
    arrangementSeed: seed,
    personalisation: { cardMessage: "", recipientName: "", itemNames: {} },
  };
}

function input(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return { country: "PK", design: design(), hasProblems: false, ...overrides };
}

interface Pending {
  request: QuoteRequest;
  signal: AbortSignal;
  resolve(response: QuoteResponse): void;
  reject(error: unknown): void;
}

function setup() {
  const pending: Pending[] = [];
  const updates: QuoteUpdate[] = [];
  const scheduler = createQuoteScheduler({
    fetchQuote: (request, signal) =>
      new Promise<QuoteResponse>((resolve, reject) => {
        pending.push({ request, signal, resolve, reject });
      }),
    onChange: (update) => updates.push(update),
  });
  const last = () => updates[updates.length - 1];
  return { scheduler, pending, updates, last };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createQuoteScheduler", () => {
  it("waits 300 ms, then asks once", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input());
    expect(last()).toEqual({ quote: null, status: "loading" });
    await vi.advanceTimersByTimeAsync(299);
    expect(pending).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(pending).toHaveLength(1);
  });

  it("sends the country and the design and nothing else", async () => {
    const { scheduler, pending } = setup();
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(300);
    expect(Object.keys(pending[0]?.request ?? {}).sort()).toEqual(["country", "design"]);
    expect(pending[0]?.request.country).toBe("PK");
    expect(JSON.stringify(pending[0]?.request)).not.toMatch(/price|minor|total/i);
  });

  it("debounces: only the last of several quick changes is sent", async () => {
    const { scheduler, pending } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(200);
    scheduler.update(input({ design: design(2) }));
    await vi.advanceTimersByTimeAsync(200);
    scheduler.update(input({ design: design(3) }));
    await vi.advanceTimersByTimeAsync(300);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.request.design.items[0]?.qty).toBe(3);
  });

  it("reports ready with the quote", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(300);
    const quote = makeQuoteResponse(4200);
    pending[0]?.resolve(quote);
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toEqual({ quote, status: "ready" });
  });

  it("ignores an answer that arrives after a newer change", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(300);
    scheduler.update(input({ design: design(2) }));
    expect(pending[0]?.signal.aborted).toBe(true);
    pending[0]?.resolve(makeQuoteResponse(111));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toEqual({ quote: null, status: "loading" });

    await vi.advanceTimersByTimeAsync(300);
    pending[1]?.resolve(makeQuoteResponse(222));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.quote?.quotes[0]?.totalMinor).toBe(222);
  });

  it("ignores an old failure that arrives after a newer change", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(300);
    scheduler.update(input({ design: design(2) }));
    pending[0]?.reject(new Error("aborted"));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.status).toBe("loading");
  });

  it("keeps the previous quote visible while the next loads", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(300);
    const first = makeQuoteResponse(100);
    pending[0]?.resolve(first);
    await vi.advanceTimersByTimeAsync(0);
    scheduler.update(input({ design: design(2) }));
    expect(last()).toEqual({ quote: first, status: "loading" });
  });

  it("skips the call and goes idle when there is no design", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: null }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(pending).toHaveLength(0);
    expect(last()).toEqual({ quote: null, status: "idle" });
  });

  it("skips the call and drops the quote when the design has problems", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(300);
    pending[0]?.resolve(makeQuoteResponse(100));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.status).toBe("ready");

    scheduler.update(input({ design: design(9), hasProblems: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(pending).toHaveLength(1);
    expect(last()).toEqual({ quote: null, status: "idle" });
  });

  it("cancels a pending call when the design becomes invalid", async () => {
    const { scheduler, pending } = setup();
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(100);
    scheduler.update(input({ hasProblems: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(pending).toHaveLength(0);
  });

  it("goes to error with no quote when the call fails", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(300);
    pending[0]?.resolve(makeQuoteResponse(100));
    await vi.advanceTimersByTimeAsync(0);

    scheduler.update(input({ design: design(2) }));
    await vi.advanceTimersByTimeAsync(300);
    pending[1]?.reject(new Error("422 DESIGN_INVALID"));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()).toEqual({ quote: null, status: "error" });
  });

  it("asks again after an error when the design changes", async () => {
    const { scheduler, pending, last } = setup();
    scheduler.update(input({ design: design(1) }));
    await vi.advanceTimersByTimeAsync(300);
    pending[0]?.reject(new Error("offline"));
    await vi.advanceTimersByTimeAsync(0);
    expect(last()?.status).toBe("error");

    scheduler.update(input({ design: design(2) }));
    await vi.advanceTimersByTimeAsync(300);
    expect(pending).toHaveLength(2);
  });

  it("does nothing for an unchanged design", async () => {
    const { scheduler, pending, updates } = setup();
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(300);
    pending[0]?.resolve(makeQuoteResponse(100));
    await vi.advanceTimersByTimeAsync(0);
    const count = updates.length;
    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(1000);
    expect(updates).toHaveLength(count);
    expect(pending).toHaveLength(1);
  });

  it("dispose stops the timer and ignores a late answer", async () => {
    const { scheduler, pending, updates } = setup();
    scheduler.update(input());
    scheduler.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(pending).toHaveLength(0);

    scheduler.update(input());
    await vi.advanceTimersByTimeAsync(300);
    scheduler.dispose();
    const count = updates.length;
    pending[0]?.resolve(makeQuoteResponse(100));
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toHaveLength(count);
  });

  it("uses injected timers", () => {
    const setTimer = vi.fn(() => 42);
    const clearTimer = vi.fn();
    const scheduler = createQuoteScheduler({
      fetchQuote: () => new Promise<QuoteResponse>(() => undefined),
      onChange: () => undefined,
      delayMs: 50,
      setTimer,
      clearTimer,
    });
    scheduler.update(input({ design: design(1) }));
    expect(setTimer).toHaveBeenCalledWith(expect.any(Function), 50);
    scheduler.update(input({ design: design(2) }));
    expect(clearTimer).toHaveBeenCalledWith(42);
  });
});
