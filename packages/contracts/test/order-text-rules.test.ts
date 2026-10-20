import { describe, expect, it } from "vitest";

import {
  CreateOrderRequestSchema,
  addressLineText,
  digitsOnly,
  nameText,
  postalCodeText,
  validateOrderPersonalisation,
} from "../src/index";

import { id, makeCatalog, makeDesign, makeItem, pricedItem } from "./helpers";

function personalised(personalisation: {
  recipientName?: string;
  cardMessage?: string;
  itemNames?: Record<string, string>;
}) {
  return makeDesign(undefined, {
    personalisation: {
      recipientName: "Sara",
      cardMessage: "Happy birthday",
      customRequest: "",
      itemNames: {},
      ...personalisation,
    },
  });
}

const catalogWithNameable = () =>
  makeCatalog({
    items: [
      pricedItem(makeItem(1, { personalizable: true, personalizationMaxLength: 10 })),
      pricedItem(makeItem(2)),
    ],
  });

describe("text filters", () => {
  it("keep what a field can hold and drop the rest", () => {
    expect(nameText("Zoë O'Neil-Smith 3!")).toBe("Zoë O'Neil-Smith ");
    expect(digitsOnly("+92 (300) 123-4567")).toBe("923001234567");
    expect(postalCodeText("SW1A 1AA<>")).toBe("SW1A 1AA");
    expect(addressLineText("12/B, Main St. #4 <script>")).toBe("12/B, Main St. #4 script");
  });
});

describe("validateOrderPersonalisation", () => {
  const run = (design: ReturnType<typeof personalised>) =>
    validateOrderPersonalisation(design, catalogWithNameable());

  it("accepts a filled design with a name on each personalizable item", () => {
    const design = makeDesign([{ n: 1 }, { n: 2 }], {
      personalisation: {
        recipientName: "Sara",
        cardMessage: "Hi",
        customRequest: "",
        itemNames: { [id(101)]: "Sara" },
      },
    });
    expect(run(design)).toEqual([]);
  });

  it("requires the recipient and the card message, and treats blanks as empty", () => {
    const problems = run(personalised({ recipientName: "   ", cardMessage: "" }));
    expect(problems.map((p) => [p.code, p.field])).toEqual([
      ["TEXT_REQUIRED", "recipientName"],
      ["TEXT_REQUIRED", "cardMessage"],
      ["TEXT_REQUIRED", "itemNames"],
    ]);
  });

  it("requires a name on every personalizable item that is in the design", () => {
    const problems = run(personalised({ itemNames: { [id(101)]: " " } }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatchObject({ code: "TEXT_REQUIRED", itemId: id(101) });
  });

  it("does not ask for a name on an item that is not in the design", () => {
    const design = makeDesign([{ n: 2 }, { n: 3 }], {
      personalisation: {
        recipientName: "Sara",
        cardMessage: "Hi",
        customRequest: "",
        itemNames: {},
      },
    });
    expect(validateOrderPersonalisation(design, catalogWithNameable())).toEqual([]);
  });

  it("rejects digits and symbols in the recipient and in item names", () => {
    const problems = run(
      personalised({ recipientName: "R2D2", itemNames: { [id(101)]: "Sara 1" } }),
    );
    expect(problems.map((p) => [p.code, p.field])).toEqual([
      ["TEXT_INVALID", "recipientName"],
      ["TEXT_INVALID", "itemNames"],
    ]);
  });

  it("lets the card message and the custom request hold any text", () => {
    const design = makeDesign([{ n: 1 }], {
      personalisation: {
        recipientName: "Sara",
        cardMessage: "Happy 25th! <3 :)",
        customRequest: "Blue ribbon #2 please",
        itemNames: { [id(101)]: "Sara" },
      },
    });
    expect(run(design)).toEqual([]);
  });
});

describe("CreateOrderRequestSchema: what a new order may hold", () => {
  const base = () => ({
    country: "PK",
    design: makeDesign(),
    contact: { name: "Sara Khan", email: "sara@example.com", phone: "+92 3001234567" },
    address: {
      line1: "12/B, Main St. #4",
      city: "Lahore",
      region: "Punjab",
      postalCode: "54000",
    },
    paymentMode: "cod",
  });
  const parse = (patch: Record<string, unknown>) => {
    const input = base();
    for (const [key, value] of Object.entries(patch)) {
      const [group, field] = key.split(".") as [keyof ReturnType<typeof base>, string];
      Object.assign(input[group] as object, { [field]: value });
    }
    return CreateOrderRequestSchema.safeParse(input).success;
  };

  it("accepts a normal order", () => {
    expect(parse({})).toBe(true);
  });

  it.each([
    ["contact.name", "Sara 123"],
    ["contact.phone", "abc 123456"],
    ["contact.phone", "+92 (300) 123-4567"],
    ["address.city", "L4hore"],
    ["address.region", "Punjab 99"],
    ["address.postalCode", "54<>"],
    ["address.line1", "12 <b>"],
    ["address.line2", "Flat $5"],
  ])("rejects %s = %s", (key, value) => {
    expect(parse({ [key]: value })).toBe(false);
  });

  it("accepts UK and Canadian style postcodes", () => {
    expect(parse({ "address.postalCode": "SW1A 1AA" })).toBe(true);
    expect(parse({ "address.postalCode": "K1A-0B1" })).toBe(true);
  });
});
