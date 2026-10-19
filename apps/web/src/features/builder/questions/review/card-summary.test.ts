import { describe, expect, it } from "vitest";

import { cardSummary } from "./card-summary";

describe("cardSummary", () => {
  it("returns the trimmed recipient and message", () => {
    expect(cardSummary({ cardMessage: " Thinking of you ", recipientName: " Amna " })).toEqual({
      recipient: "Amna",
      message: "Thinking of you",
    });
  });

  it("keeps one field when the other is blank", () => {
    expect(cardSummary({ cardMessage: "Hello", recipientName: "  " })).toEqual({
      recipient: null,
      message: "Hello",
    });
  });

  it("is null when the customer wrote nothing", () => {
    expect(cardSummary({ cardMessage: "", recipientName: " " })).toBeNull();
  });
});
