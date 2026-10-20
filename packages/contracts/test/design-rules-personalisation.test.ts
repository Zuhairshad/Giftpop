import { describe, expect, it } from "vitest";

import { validateDesign } from "../src/index";
import type { DesignProblemCode } from "../src/index";

import { id, makeCatalog, makeDesign, makeItem, pricedItem } from "./helpers";

function codes(problems: readonly { code: DesignProblemCode }[]): DesignProblemCode[] {
  return problems.map((p) => p.code);
}

describe("validateDesign: personalisation limits", () => {
  const personalise = (personalisation: {
    cardMessage?: string;
    recipientName?: string;
    customRequest?: string;
    itemNames?: Record<string, string>;
  }) =>
    makeDesign(undefined, {
      personalisation: {
        cardMessage: "",
        recipientName: "",
        customRequest: "",
        itemNames: {},
        ...personalisation,
      },
    });

  it("allows a card message of exactly 200 characters and flags 201", () => {
    expect(validateDesign(personalise({ cardMessage: "a".repeat(200) }), makeCatalog())).toEqual(
      [],
    );
    const problems = validateDesign(personalise({ cardMessage: "a".repeat(201) }), makeCatalog());
    expect(codes(problems)).toEqual(["TEXT_TOO_LONG"]);
    expect(problems[0]?.field).toBe("cardMessage");
  });

  it("allows a recipient name of exactly 40 characters and flags 41", () => {
    expect(validateDesign(personalise({ recipientName: "n".repeat(40) }), makeCatalog())).toEqual(
      [],
    );
    const problems = validateDesign(personalise({ recipientName: "n".repeat(41) }), makeCatalog());
    expect(codes(problems)).toEqual(["TEXT_TOO_LONG"]);
    expect(problems[0]?.field).toBe("recipientName");
  });

  it("allows a custom request of exactly 500 characters and flags 501", () => {
    expect(validateDesign(personalise({ customRequest: "r".repeat(500) }), makeCatalog())).toEqual(
      [],
    );
    const problems = validateDesign(personalise({ customRequest: "r".repeat(501) }), makeCatalog());
    expect(codes(problems)).toEqual(["TEXT_TOO_LONG"]);
    expect(problems[0]?.field).toBe("customRequest");
  });

  describe("names on items", () => {
    const catalog = makeCatalog({
      items: [
        pricedItem(makeItem(1, { personalizable: true, personalizationMaxLength: 10 })),
        pricedItem(makeItem(2)),
      ],
    });

    it("allows a name up to the item's own limit", () => {
      const design = personalise({ itemNames: { [id(101)]: "x".repeat(10) } });
      expect(validateDesign(design, catalog)).toEqual([]);
    });

    it("flags a name one character over the item's limit", () => {
      const design = personalise({ itemNames: { [id(101)]: "x".repeat(11) } });
      const problems = validateDesign(design, catalog);
      expect(codes(problems)).toEqual(["TEXT_TOO_LONG"]);
      expect(problems[0]).toMatchObject({ itemId: id(101), field: "itemNames" });
    });

    it("flags any name on an item that is not personalizable", () => {
      const design = personalise({ itemNames: { [id(102)]: "Ali" } });
      const problems = validateDesign(design, catalog);
      expect(codes(problems)).toEqual(["TEXT_TOO_LONG"]);
      expect(problems[0]).toMatchObject({ itemId: id(102), field: "itemNames" });
    });

    it("flags a name for an item the catalog does not have", () => {
      const design = personalise({ itemNames: { [id(777)]: "Ali" } });
      expect(codes(validateDesign(design, catalog))).toEqual(["TEXT_TOO_LONG"]);
    });
  });
});
