import { describe, expect, it } from "vitest";

import {
  addressLines,
  buildChecklist,
  checklistDensity,
  colourName,
  colourWord,
  customRequestText,
  hasPersonalisation,
  packerNotes,
  totalPieces,
} from "./view-model";

const A = "a".repeat(24);
const B = "b".repeat(24);
const order = {
  items: [
    { itemId: A, name: "Rose", qty: 3 },
    { itemId: B, name: "Mug", qty: 1 },
  ],
  design: {
    items: [
      { itemId: A, qty: 3, slot: 1 },
      { itemId: B, qty: 1, slot: 0 },
    ],
    personalisation: { cardMessage: " hi ", recipientName: "", customRequest: "", itemNames: { [B]: " Sam " } },
  },
} as unknown as Parameters<typeof buildChecklist>[0];

describe("colourWord", () => {
  it("names exact and near colours", () => {
    expect(colourWord("#FF0000")).toBe("Red");
    expect(colourWord("#fa0505")).toBe("Red");
    expect(colourWord("#ffffff")).toBe("White");
  });
  it("returns nothing for unknown or invalid input", () => {
    expect(colourWord("#4b6c2f9")).toBe("");
    expect(colourWord("nope")).toBe("");
  });
});

describe("colourName", () => {
  it("prefers the palette name saved on the order", () => {
    expect(colourName("#e6b8b7", "Rose quartz")).toBe("Rose quartz");
  });
  it("falls back to the nearest colour word for orders placed before names were saved", () => {
    expect(colourName("#fa0505", undefined)).toBe("Red");
    expect(colourName("nope", undefined)).toBe("");
  });
});

describe("buildChecklist", () => {
  it("orders by slot and carries custom names", () => {
    const lines = buildChecklist(order);
    expect(lines.map((l) => l.name)).toEqual(["Mug", "Rose"]);
    expect(lines[0]?.customName).toBe("Sam");
    expect(lines[1]?.customName).toBeNull();
    expect(totalPieces(lines)).toBe(4);
  });
});

describe("helpers", () => {
  it("builds address lines without blanks", () => {
    const lines = addressLines({
      contact: { name: "Ann", email: "a@b.co", phone: "+92 300 1" },
      address: { line1: "1 Road", line2: "", city: "Lahore", region: "", postalCode: "54000" },
      country: "PK",
    });
    expect(lines).toEqual(["Ann", "1 Road", "Lahore, 54000", "PK", "+92 300 1"]);
  });
  it("detects personalisation", () => {
    expect(hasPersonalisation(order)).toBe(true);
    expect(
      hasPersonalisation({
        design: { personalisation: { cardMessage: " ", recipientName: "", customRequest: " ", itemNames: {} } },
      } as unknown as Parameters<typeof hasPersonalisation>[0]),
    ).toBe(false);
  });
  it("counts a custom request alone as personalisation and returns it whole", () => {
    const only = {
      design: {
        personalisation: {
          cardMessage: "",
          recipientName: "",
          customRequest: "Line one\nline two",
          itemNames: {},
        },
      },
    } as unknown as Parameters<typeof hasPersonalisation>[0];
    expect(hasPersonalisation(only)).toBe(true);
    expect(customRequestText(only)).toBe("Line one\nline two");
    expect(customRequestText(order)).toBeNull();
  });
  it("keeps a very long unbroken request", () => {
    const long = "y".repeat(500);
    const o = {
      design: { personalisation: { customRequest: long } },
    } as unknown as Parameters<typeof customRequestText>[0];
    expect(customRequestText(o)).toBe(long);
  });
  it("sorts notes and drops blanks", () => {
    const notes = [
      { text: "second", at: "2026-10-19T10:00:00.000Z" },
      { text: "  ", at: "2026-10-19T09:00:00.000Z" },
      { text: "first", at: "2026-10-19T08:00:00.000Z" },
    ] as unknown as Parameters<typeof packerNotes>[0]["notes"];
    expect(packerNotes({ notes })).toEqual(["first", "second"]);
  });
  it("picks density by line count", () => {
    expect(checklistDensity(3)).toBe("roomy");
    expect(checklistDensity(10)).toBe("compact");
    expect(checklistDensity(20)).toBe("tight");
  });
});
