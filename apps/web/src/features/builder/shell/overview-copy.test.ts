import { describe, expect, it } from "vitest";

import { makeQuoteResponse } from "../state/test-fixtures";

import { colourName, overviewCaption, priceView } from "./overview-copy";

describe("overviewCaption", () => {
  it("names the packaging and counts the items", () => {
    expect(overviewCaption("Hand-tied bouquet", 8)).toBe("Hand-tied bouquet, 8 items");
  });

  it("uses the singular for one item and says so when there are none", () => {
    expect(overviewCaption("Gift box", 1)).toBe("Gift box, 1 item");
    expect(overviewCaption("Gift box", 0)).toBe("Gift box, no items yet");
  });
});

describe("colourName", () => {
  const options = [
    { name: "Kraft", hex: "#D2A878" },
    { name: "Raspberry", hex: "#e8467c" },
  ];

  it("finds the palette name whatever the letter case of the hex", () => {
    expect(colourName(options, "#d2a878")).toBe("Kraft");
    expect(colourName(options, "#E8467C")).toBe("Raspberry");
  });

  it("falls back to the hex code, or none when nothing is chosen", () => {
    expect(colourName(options, "#000000")).toBe("#000000");
    expect(colourName(options, null)).toBe("none");
  });
});

describe("priceView", () => {
  it("shows the gift price of the first quote in the quote's currency", () => {
    const quote = makeQuoteResponse(1000);
    const view = priceView(quote, "ready");
    expect(view.kind).toBe("amount");
    if (view.kind === "amount") {
      expect(view.text).toContain(String((quote.quotes[0]?.goodsMinor ?? 0) / 100));
    }
  });

  it("keeps the old amount while a new quote loads", () => {
    expect(priceView(makeQuoteResponse(), "loading").kind).toBe("amount");
  });

  it("has no amount before the first quote, and says so after a failed one", () => {
    expect(priceView(null, "idle")).toEqual({ kind: "pending" });
    expect(priceView(null, "loading")).toEqual({ kind: "pending" });
    expect(priceView(null, "error")).toEqual({ kind: "error" });
  });
});
