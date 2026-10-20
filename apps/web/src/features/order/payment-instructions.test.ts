import { describe, expect, it } from "vitest";

import { parsePaymentInstructions } from "./payment-instructions";

describe("parsePaymentInstructions", () => {
  it("keeps one plain sentence as one text block", () => {
    const text =
      "Bank transfer to The Giftpop, account 0000 0000 0000, reference: your order number";
    expect(parsePaymentInstructions(text)).toEqual([{ kind: "text", lines: [text] }]);
  });

  it("turns Label: value lines into rows and keeps the text around them", () => {
    const text = [
      "Pay by bank transfer.",
      "Account title: The Giftpop",
      "IBAN: PK00 TEST 0000 0000",
      "",
      "Send the receipt below.",
    ].join("\n");
    expect(parsePaymentInstructions(text)).toEqual([
      { kind: "text", lines: ["Pay by bank transfer."] },
      {
        kind: "details",
        rows: [
          { label: "Account title", value: "The Giftpop" },
          { label: "IBAN", value: "PK00 TEST 0000 0000" },
        ],
      },
      { kind: "text", lines: ["Send the receipt below."] },
    ]);
  });

  it("keeps paragraphs apart and line breaks inside them", () => {
    const text = "Line one\r\nLine two\r\n\r\n\r\nNext paragraph";
    expect(parsePaymentInstructions(text)).toEqual([
      { kind: "text", lines: ["Line one", "Line two"] },
      { kind: "text", lines: ["Next paragraph"] },
    ]);
  });

  it("does not split links, times or long sentences at a colon", () => {
    const text = [
      "https://pay.example.com/giftpop",
      "Open 9:30 to 17:00",
      "If you pay from abroad, add the fees: we receive the full amount",
    ].join("\n");
    expect(parsePaymentInstructions(text)).toEqual([{ kind: "text", lines: text.split("\n") }]);
  });

  it("answers nothing for blank text", () => {
    expect(parsePaymentInstructions("")).toEqual([]);
    expect(parsePaymentInstructions("  \n \n")).toEqual([]);
  });
});
