import { CreatePartnerRequestSchema, PARTNER_HONEYPOT_FIELD } from "@giftpop/contracts";
import type { PublicCountry } from "@giftpop/contracts";
import { describe, expect, it } from "vitest";

import { notLiveCountries, prefillCountry, sortByName } from "./countries";
import { BRAND_FIELDS, COUNTRY_FIELDS, emptyValues } from "./fields";
import type { PartnerValues } from "./fields";
import {
  HONEYPOT_INPUT_PROPS,
  HONEYPOT_WRAPPER_STYLE,
  firstInvalidField,
  parseTags,
  validatePartnerForm,
  withHoneypot,
} from "./request";
import {
  INITIAL_SUBMIT_STATE,
  classifySubmitError,
  failureMessage,
  mapDetailsToFields,
  submitReducer,
} from "./submit-state";

import { ApiError, ApiNetworkError, ApiSchemaError } from "@/lib/api-errors";

function country(code: string, name: string, status: "live" | "coming_soon"): PublicCountry {
  return {
    code,
    name,
    currency: "USD",
    status,
    paymentModes: [],
    shipping: { flatMinor: 0, deliveryDays: { min: 1, max: 2 } },
    addressFormat: {
      region: { required: false, label: "Region" },
      postalCode: { required: false, label: "Postcode" },
    },
  };
}

const COUNTRIES = [
  country("PK", "Pakistan", "live"),
  country("DE", "Germany", "coming_soon"),
  country("BR", "Brazil", "coming_soon"),
];

const brandValues: PartnerValues = {
  brandName: "  Moon Candles ",
  contactName: "Sana",
  email: "sana@example.com",
  phone: "+92 300 1234567",
  country: "PK",
  categories: "candles, Tea , candles,, ",
  link: "instagram.com/mooncandles",
  message: "",
};

const countryValues: PartnerValues = {
  country: "DE",
  contactName: "Jan",
  email: "jan@example.com",
  phone: "+49 30 123456",
  offering: "A workshop in Berlin",
  message: "",
};

const messageFor = (): string => "Check this field.";

describe("parseTags", () => {
  it("trims, drops empties and repeats, keeps order", () => {
    expect(parseTags(" candles, Tea ,, CANDLES ,\n mugs ")).toEqual(["candles", "Tea", "mugs"]);
  });
  it("returns nothing for blank input", () => {
    expect(parseTags(" , ,\n")).toEqual([]);
  });
  it("collapses inner whitespace", () => {
    expect(parseTags("hand   made soap")).toEqual(["hand made soap"]);
  });
});

describe("validatePartnerForm", () => {
  it("builds a valid brand request the contract accepts", () => {
    const result = validatePartnerForm("brand", brandValues);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(CreatePartnerRequestSchema.safeParse(result.request).success).toBe(true);
    expect(result.request).toMatchObject({
      kind: "brand",
      brandName: "Moon Candles",
      productCategories: ["candles", "Tea"],
      message: "",
    });
  });

  it("builds a valid country request", () => {
    const result = validatePartnerForm("country", countryValues);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request).toMatchObject({
      kind: "country",
      country: "DE",
      offering: "A workshop in Berlin",
    });
  });

  it("reports every empty required field with plain messages", () => {
    const result = validatePartnerForm("brand", emptyValues("brand"));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      ["brandName", "categories", "contactName", "country", "email", "link", "phone"].sort(),
    );
    expect(result.errors.categories).toBe("Add at least one product category.");
    expect(result.errors.country).toBe("Choose a country.");
  });

  it("flags a bad email and phone, and too many categories", () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => `c${i}`).join(",");
    const result = validatePartnerForm("brand", {
      ...brandValues,
      email: "nope",
      phone: "abc",
      categories: tooMany,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toMatch(/valid email/);
    expect(result.errors.phone).toMatch(/phone number/);
    expect(result.errors.categories).toMatch(/up to 20/);
  });

  it("flags a category over 40 characters and a message over 2000", () => {
    const result = validatePartnerForm("brand", {
      ...brandValues,
      categories: "x".repeat(41),
      message: "m".repeat(2001),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.categories).toMatch(/under 40/);
    expect(result.errors.message).toBe("Keep the message under 2000 characters.");
  });

  it("never shows schema text and ignores fields the form does not have", () => {
    const result = validatePartnerForm("country", { ...countryValues, offering: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({ offering: "Tell us what you can offer." });
  });

  it("finds the first invalid field in page order", () => {
    const result = validatePartnerForm("country", emptyValues("country"));
    if (result.ok) throw new Error("expected errors");
    expect(firstInvalidField(COUNTRY_FIELDS, result.errors)).toBe("country");
    expect(firstInvalidField(BRAND_FIELDS, { link: "x", email: "y" })).toBe("email");
    expect(firstInvalidField(BRAND_FIELDS, {})).toBeUndefined();
  });
});

describe("honeypot", () => {
  it("is named by the contract and kept out of reach of people", () => {
    expect(HONEYPOT_INPUT_PROPS.name).toBe(PARTNER_HONEYPOT_FIELD);
    expect(HONEYPOT_INPUT_PROPS.tabIndex).toBe(-1);
    expect(HONEYPOT_INPUT_PROPS.autoComplete).toBe("off");
    expect(HONEYPOT_INPUT_PROPS["aria-hidden"]).toBe(true);
    expect(HONEYPOT_WRAPPER_STYLE).toMatchObject({ position: "absolute", left: "-10000px" });
  });

  it("is included in the body, empty or filled", () => {
    const result = validatePartnerForm("country", countryValues);
    if (!result.ok) throw new Error("expected a valid request");
    expect(withHoneypot(result.request, "")[PARTNER_HONEYPOT_FIELD]).toBe("");
    const filled = withHoneypot(result.request, "http://spam");
    expect(filled[PARTNER_HONEYPOT_FIELD]).toBe("http://spam");
    expect(filled).toMatchObject(result.request);
  });
});

describe("countries", () => {
  it("keeps only countries that are not live, by name", () => {
    expect(notLiveCountries(COUNTRIES).map((c) => c.code)).toEqual(["BR", "DE"]);
    expect(notLiveCountries([COUNTRIES[0]!])).toEqual([]);
  });
  it("sorts all countries by name without changing the input", () => {
    expect(sortByName(COUNTRIES).map((c) => c.code)).toEqual(["BR", "DE", "PK"]);
    expect(COUNTRIES[0]?.code).toBe("PK");
  });
  it("prefills only a not-live country, case-insensitively", () => {
    const available = notLiveCountries(COUNTRIES);
    expect(prefillCountry("de", available)).toBe("DE");
    expect(prefillCountry("PK", available)).toBe("");
    expect(prefillCountry("ZZ", available)).toBe("");
    expect(prefillCountry(["DE", "BR"], available)).toBe("");
    expect(prefillCountry(undefined, available)).toBe("");
  });
});

describe("submit state machine", () => {
  const failure = { kind: "generic" } as const;
  it("goes idle, sending, success and stays there", () => {
    const sending = submitReducer(INITIAL_SUBMIT_STATE, { type: "submit" });
    expect(sending.status).toBe("sending");
    expect(submitReducer(sending, { type: "submit" })).toBe(sending);
    const done = submitReducer(sending, { type: "succeeded" });
    expect(done.status).toBe("success");
    expect(submitReducer(done, { type: "submit" })).toBe(done);
    expect(submitReducer(done, { type: "failed", failure })).toBe(done);
  });
  it("returns to idle with the failure so the person can try again", () => {
    const sending = submitReducer(INITIAL_SUBMIT_STATE, { type: "submit" });
    const failed = submitReducer(sending, { type: "failed", failure });
    expect(failed).toEqual({ status: "idle", failure });
    expect(submitReducer(failed, { type: "submit" }).status).toBe("sending");
  });
  it("ignores results that arrive when nothing is sending", () => {
    expect(submitReducer(INITIAL_SUBMIT_STATE, { type: "succeeded" })).toBe(INITIAL_SUBMIT_STATE);
  });
});

describe("error mapping", () => {
  const body = (code: string, details?: unknown) => ({ code, message: "raw api text", details });

  it("maps 429 to the rate limit message", () => {
    const failure = classifySubmitError(
      "brand",
      new ApiError(429, body("RATE_LIMITED")),
      messageFor,
    );
    expect(failure).toEqual({ kind: "rate_limited" });
    expect(failureMessage(failure)).toBe(
      "You have sent a few requests already. Please try again later.",
    );
  });

  it("maps zod issues and field entries to fields, productCategories to categories", () => {
    const failure = classifySubmitError(
      "brand",
      new ApiError(
        400,
        body("VALIDATION_ERROR", [
          { path: ["productCategories", 0], message: "x" },
          { field: "email", message: "y" },
          { path: ["kind"], message: "ignored" },
        ]),
      ),
      messageFor,
    );
    expect(failure).toEqual({
      kind: "fields",
      fields: { categories: "Check this field.", email: "Check this field." },
    });
  });

  it("falls back to generic when details name no field of this form", () => {
    expect(mapDetailsToFields("country", [{ path: ["brandName"] }], messageFor)).toEqual({});
    const failure = classifySubmitError(
      "country",
      new ApiError(422, body("VALIDATION_ERROR", "not an array")),
      messageFor,
    );
    expect(failure).toEqual({ kind: "generic" });
  });

  it("maps network failures to offline and everything else to generic, without raw text", () => {
    expect(classifySubmitError("brand", new ApiNetworkError("down"), messageFor)).toEqual({
      kind: "offline",
    });
    for (const error of [
      new ApiError(500, body("INTERNAL")),
      new ApiSchemaError("bad"),
      new Error("boom"),
    ]) {
      const failure = classifySubmitError("brand", error, messageFor);
      expect(failure).toEqual({ kind: "generic" });
      expect(failureMessage(failure)).not.toMatch(/raw api text|boom|bad/);
    }
  });
});
