import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOUQUET_ID, CARD_ID, makeQuoteResponse, newTestStore } from "./test-fixtures";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("quote in the store", () => {
  it("does not call the API while the design is missing or has problems", async () => {
    const { api, fetchQuote } = newTestStore();
    await vi.advanceTimersByTimeAsync(1000);
    api().choosePackaging(BOUQUET_ID); // too few items
    api().addItem(CARD_ID); // still too few (needs 2)
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchQuote).not.toHaveBeenCalled();
    expect(api().quoteStatus).toBe("idle");
    expect(api().quote).toBeNull();
  });

  it("loads, then shows the quote 300 ms after the design becomes valid", async () => {
    const { api, fetchQuote } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    expect(api().quoteStatus).toBe("loading");
    expect(fetchQuote).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);
    expect(fetchQuote).toHaveBeenCalledTimes(1);
    expect(fetchQuote.mock.calls[0]?.[0]).toEqual({ country: "PK", design: api().design });
    expect(api().quoteStatus).toBe("ready");
    expect(api().quote).toEqual(makeQuoteResponse());
  });

  it("sends one request for a burst of changes", async () => {
    const { api, fetchQuote } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    await vi.advanceTimersByTimeAsync(100);
    api().addItem(CARD_ID);
    await vi.advanceTimersByTimeAsync(100);
    api().setCardMessage("Hello");
    await vi.advanceTimersByTimeAsync(300);
    expect(fetchQuote).toHaveBeenCalledTimes(1);
    expect(fetchQuote.mock.calls[0]?.[0].design.personalisation.cardMessage).toBe("Hello");
  });

  it("sets status to error and no quote when the API fails", async () => {
    const { api, fetchQuote } = newTestStore();
    fetchQuote.mockRejectedValueOnce(new Error("422 DESIGN_INVALID"));
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    await vi.advanceTimersByTimeAsync(300);
    expect(api().quoteStatus).toBe("error");
    expect(api().quote).toBeNull();
  });

  it("clears the quote when the design stops being valid", async () => {
    const { api } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    await vi.advanceTimersByTimeAsync(300);
    expect(api().quote).not.toBeNull();
    api().removeItem(CARD_ID);
    expect(api().quote).toBeNull();
    expect(api().quoteStatus).toBe("idle");
  });

  it("asks for a quote for a design restored from storage", async () => {
    const first = newTestStore();
    first.api().choosePackaging(BOUQUET_ID);
    first.api().addItem(CARD_ID);
    first.api().addItem(CARD_ID);

    const second = newTestStore({ getStorage: () => first.storage });
    expect(second.api().quoteStatus).toBe("loading");
    await vi.advanceTimersByTimeAsync(300);
    expect(second.fetchQuote).toHaveBeenCalledTimes(1);
    expect(second.api().quoteStatus).toBe("ready");
  });

  it("stops asking after dispose", async () => {
    const { api, store, fetchQuote } = newTestStore();
    api().choosePackaging(BOUQUET_ID);
    api().addItem(CARD_ID);
    api().addItem(CARD_ID);
    store.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchQuote).not.toHaveBeenCalled();
  });
});
