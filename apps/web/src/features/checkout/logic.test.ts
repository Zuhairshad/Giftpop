import type { AddressFormat, Design, Quote } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { buildAddressFields } from "./address-fields";
import { withDialCode } from "./dial-codes";
import { EMPTY_FORM, firstInvalidField } from "./fields";
import type { FormValues } from "./fields";
import { saveOrderHandoff } from "./handoff";
import { createIdempotencyKeys } from "./idempotency";
import { buildOrderRequest, requestFingerprint } from "./order-request";
import { buildPaymentCards, resolveSelectedMode } from "./payment-cards";
import { checkForm } from "./validate-form";

const PK: AddressFormat = {
  region: { required: true, label: "Province" },
  postalCode: { required: false, label: "Postal code" },
};
const GB: AddressFormat = {
  region: { required: false, label: "County" },
  postalCode: { required: true, label: "Postcode" },
};
const US: AddressFormat = {
  region: { required: true, label: "State" },
  postalCode: { required: true, label: "ZIP" },
};

const DESIGN: Design = {
  packagingId: "a1a1a1a1a1a1a1a1a1a1a1a1",
  items: [{ itemId: "b1b1b1b1b1b1b1b1b1b1b1b1", qty: 2, slot: 0 }],
  wrapperColor: "#fff8e7",
  ribbonColor: "#d4af37",
  arrangementSeed: 5,
  personalisation: { cardMessage: "Hi", customRequest: "", recipientName: "Sam", itemNames: {} },
};

function form(overrides: Partial<FormValues["contact"] & FormValues["address"]> = {}): FormValues {
  return {
    contact: {
      name: overrides.name ?? "Ayesha Khan",
      email: overrides.email ?? "ayesha@example.com",
      phone: overrides.phone ?? "0300 1234567",
    },
    address: {
      line1: overrides.line1 ?? "12 Garden Road",
      line2: overrides.line2 ?? "",
      city: overrides.city ?? "Lahore",
      region: overrides.region ?? "",
      postalCode: overrides.postalCode ?? "",
    },
  };
}

describe("address field filters", () => {
  it("keep letters-only fields free of digits and the postal code free of symbols", () => {
    const filters = Object.fromEntries(buildAddressFields(PK).map((f) => [f.name, f.filter]));
    expect(filters.city?.("Lahore 54000!")).toBe("Lahore ");
    expect(filters.region?.("Punjab2")).toBe("Punjab");
    expect(filters.postalCode?.("54000#")).toBe("54000");
    expect(filters.line1?.("House 12, Street 4 <b>")).toBe("House 12, Street 4 b");
  });
});

describe("buildAddressFields", () => {
  it("uses the country's own labels and required flags (PK)", () => {
    const fields = buildAddressFields(PK);
    expect(fields.map((f) => f.name)).toEqual(["line1", "line2", "city", "region", "postalCode"]);
    expect(fields.find((f) => f.name === "region")).toMatchObject({
      label: "Province",
      required: true,
    });
    expect(fields.find((f) => f.name === "postalCode")).toMatchObject({
      label: "Postal code",
      required: false,
    });
  });

  it("handles a GB-like format", () => {
    const fields = buildAddressFields(GB);
    expect(fields.find((f) => f.name === "region")).toMatchObject({
      label: "County",
      required: false,
    });
    expect(fields.find((f) => f.name === "postalCode")).toMatchObject({
      label: "Postcode",
      required: true,
    });
  });

  it("handles a US-like format and keeps line 1 and city required, line 2 optional", () => {
    const fields = buildAddressFields(US);
    expect(fields.find((f) => f.name === "region")).toMatchObject({
      label: "State",
      required: true,
    });
    expect(fields.find((f) => f.name === "postalCode")).toMatchObject({
      label: "ZIP",
      required: true,
    });
    expect(fields.filter((f) => f.required).map((f) => f.name)).toEqual([
      "line1",
      "city",
      "region",
      "postalCode",
    ]);
  });
});

describe("checkForm", () => {
  it("accepts a complete form and normalises phone and optional fields", () => {
    const result = checkForm(form({ region: "Punjab" }), PK, "+92");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.contact.phone).toBe("+92 300 1234567");
      expect(result.value.address).toEqual({
        line1: "12 Garden Road",
        city: "Lahore",
        region: "Punjab",
      });
    }
  });

  it("requires the fields the country format requires, with its labels", () => {
    const pk = checkForm(form(), PK, "+92");
    expect(pk.ok).toBe(false);
    if (!pk.ok) expect(pk.errors).toEqual({ region: "Province is required" });

    const us = checkForm(form(), US, "+1");
    if (!us.ok)
      expect(us.errors).toEqual({ region: "State is required", postalCode: "ZIP is required" });
  });

  it("reports plain messages for contact problems and orders the first invalid field", () => {
    const result = checkForm(
      form({ name: " ", email: "nope", phone: "abc", region: "x", line1: "" }),
      PK,
      "+92",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBe("Enter your name");
      expect(result.errors.email).toMatch(/valid email/);
      expect(result.errors.phone).toMatch(/valid phone/);
      expect(result.errors.line1).toBe("Enter the first line of the address");
      expect(firstInvalidField(result.errors)).toBe("name");
    }
  });

  it("flags text over the limit", () => {
    const result = checkForm(form({ region: "x", city: "c".repeat(81) }), PK, null);
    if (!result.ok) expect(result.errors.city).toMatch(/too long/);
    else expect.unreachable();
  });
});

describe("dial codes", () => {
  it("puts the dial code in front, drops the trunk zero, keeps typed + numbers", () => {
    expect(withDialCode("+92", "0300 1234567")).toBe("+92 300 1234567");
    expect(withDialCode("+44", "7700 900123")).toBe("+44 7700 900123");
    expect(withDialCode("+92", "+44 7700 900123")).toBe("+44 7700 900123");
    expect(withDialCode(null, "0300 123")).toBe("0300 123");
    expect(withDialCode("+92", "  ")).toBe("");
  });
});

describe("buildOrderRequest", () => {
  it("holds exactly country, design, contact, address and payment mode, and no price", () => {
    const result = checkForm(form({ region: "Punjab" }), PK, "+92");
    if (!result.ok) return expect.unreachable();
    const request = buildOrderRequest({
      country: "PK",
      design: DESIGN,
      contact: result.value.contact,
      address: result.value.address,
      paymentMode: "cod",
    });
    expect(Object.keys(request).sort()).toEqual([
      "address",
      "contact",
      "country",
      "design",
      "paymentMode",
    ]);
    expect(JSON.stringify(request)).not.toMatch(/price|minor|total/i);
    expect(request.design).toEqual(DESIGN);
    expect(request.paymentMode).toBe("cod");
  });
});

describe("idempotency keys", () => {
  it("keeps one key across retries and makes a new one when the content changes", () => {
    let n = 0;
    const keys = createIdempotencyKeys(() => `key-${++n}`);
    const a = requestFingerprint(
      buildOrderRequest({
        country: "PK",
        design: DESIGN,
        contact: { name: "A", email: "a@example.com", phone: "+92 3001234567" },
        address: { line1: "x", city: "y" },
        paymentMode: "prepaid",
      }),
    );
    const b = a.replace('"city":"y"', '"city":"z"');
    expect(keys.keyFor(a)).toBe("key-1");
    expect(keys.keyFor(a)).toBe("key-1");
    expect(keys.keyFor(b)).toBe("key-2");
    expect(keys.keyFor(b)).toBe("key-2");
    expect(keys.keyFor(a)).toBe("key-3");
  });
});

const BASE = { currency: "PKR", goodsMinor: 100000, shippingMinor: 0 };
const PREPAID: Quote = {
  ...BASE,
  mode: "prepaid",
  discountMinor: 20000,
  totalMinor: 80000,
  dueNowMinor: 80000,
  dueOnDeliveryMinor: 0,
};
const COD: Quote = {
  ...BASE,
  mode: "cod",
  discountMinor: 0,
  shippingMinor: 5000,
  totalMinor: 105000,
  dueNowMinor: 21000,
  dueOnDeliveryMinor: 84000,
};

describe("buildPaymentCards", () => {
  it("shows the quote's exact amounts for both modes", () => {
    const [prepaid, cod] = buildPaymentCards([PREPAID, COD], ["prepaid", "cod"]);
    expect(prepaid?.rows).toEqual([
      { kind: "money", label: "Gift", minor: 100000 },
      { kind: "discount", label: "Pay now discount", minor: 20000 },
      { kind: "free", label: "Shipping" },
    ]);
    expect(prepaid?.dueNow.minor).toBe(80000);
    expect(prepaid?.dueOnDelivery).toBeNull();
    expect(cod?.rows).toEqual([
      { kind: "money", label: "Gift", minor: 100000 },
      { kind: "money", label: "Shipping", minor: 5000 },
    ]);
    expect(cod?.dueNow).toEqual({ label: "Advance due now", minor: 21000 });
    expect(cod?.dueOnDelivery).toEqual({ label: "Due on delivery", minor: 84000 });
  });

  it("keeps only modes the country allows and that were quoted, once each", () => {
    expect(buildPaymentCards([PREPAID, COD], ["cod"]).map((c) => c.mode)).toEqual(["cod"]);
    expect(buildPaymentCards([PREPAID], ["prepaid", "cod"]).map((c) => c.mode)).toEqual([
      "prepaid",
    ]);
    expect(buildPaymentCards([PREPAID, PREPAID], ["prepaid"])).toHaveLength(1);
    expect(buildPaymentCards([PREPAID], [])).toEqual([]);
  });

  it("keeps a valid pick and falls back to the first card", () => {
    const cards = buildPaymentCards([PREPAID, COD], ["prepaid", "cod"]);
    expect(resolveSelectedMode(cards, "cod")).toBe("cod");
    expect(resolveSelectedMode(cards, null)).toBe("prepaid");
    expect(resolveSelectedMode(cards.slice(0, 1), "cod")).toBe("prepaid");
    expect(resolveSelectedMode([], "cod")).toBeNull();
  });
});

describe("saveOrderHandoff", () => {
  it("stores number and phone, and survives blocked storage", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    saveOrderHandoff(storage, "GP-PK-7K2M9Q", "+92 3001234567");
    expect(JSON.parse(data.get("gp-order:GP-PK-7K2M9Q") ?? "null")).toEqual({
      number: "GP-PK-7K2M9Q",
      contact: "+92 3001234567",
    });
    const blocked = {
      ...storage,
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() => saveOrderHandoff(blocked, "GP-PK-7K2M9Q", "x")).not.toThrow();
    expect(() => saveOrderHandoff(null, "GP-PK-7K2M9Q", "x")).not.toThrow();
  });
});

describe("empty form", () => {
  it("fails with every required field flagged", () => {
    const result = checkForm(EMPTY_FORM, PK, "+92");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "city",
        "email",
        "line1",
        "name",
        "phone",
        "region",
      ]);
    }
  });
});
