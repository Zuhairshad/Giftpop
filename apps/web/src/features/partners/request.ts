import {
  BrandRequestInputSchema,
  CountryRequestInputSchema,
  PARTNER_HONEYPOT_FIELD,
} from "@giftpop/contracts";
import type { CreatePartnerRequest, PartnerRequestKind } from "@giftpop/contracts";
import type { CSSProperties } from "react";

import { MAX_CATEGORIES, MAX_CATEGORY_LENGTH, isPartnerField } from "./fields";
import type { PartnerFieldErrors, PartnerFieldName, PartnerValues } from "./fields";

/** Splits "Candles, tea,  mugs" into clean tags. Empty pieces and repeats (any case) are dropped. */
export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const piece of input.split(/[,\n]/)) {
    const tag = piece.trim().replace(/\s+/g, " ");
    const key = tag.toLowerCase();
    if (tag === "" || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

const text = (values: PartnerValues, name: PartnerFieldName): string => values[name] ?? "";

export function rawBrandRequest(values: PartnerValues): Record<string, unknown> {
  return {
    kind: "brand",
    brandName: text(values, "brandName"),
    contactName: text(values, "contactName"),
    email: text(values, "email"),
    phone: text(values, "phone"),
    country: text(values, "country"),
    productCategories: parseTags(text(values, "categories")),
    link: text(values, "link"),
    message: text(values, "message"),
  };
}

export function rawCountryRequest(values: PartnerValues): Record<string, unknown> {
  return {
    kind: "country",
    country: text(values, "country"),
    contactName: text(values, "contactName"),
    email: text(values, "email"),
    phone: text(values, "phone"),
    offering: text(values, "offering"),
    message: text(values, "message"),
  };
}

const REQUIRED: Partial<Record<PartnerFieldName, string>> = {
  brandName: "Enter your brand name.",
  contactName: "Enter a contact name.",
  email: "Enter your email address.",
  phone: "Enter a phone number.",
  country: "Choose a country.",
  categories: "Add at least one product category.",
  link: "Enter a website or Instagram link.",
  offering: "Tell us what you can offer.",
};

const TOO_LONG: Partial<Record<PartnerFieldName, string>> = {
  brandName: "Keep the brand name under 120 characters.",
  contactName: "Keep the name under 80 characters.",
  link: "Keep the link under 300 characters.",
  offering: "Keep this under 1000 characters.",
  message: "Keep the message under 2000 characters.",
};

const CATEGORIES_LIMIT = `Use up to ${MAX_CATEGORIES} categories, each under ${MAX_CATEGORY_LENGTH} characters.`;

/** Our own plain wording for a field problem. Never the schema's or the API's text. */
export function fieldMessage(name: PartnerFieldName, issueCode: string, empty: boolean): string {
  const required = REQUIRED[name];
  if (empty && required) return required;
  if (name === "categories") return CATEGORIES_LIMIT;
  if (name === "email") return "Enter a valid email address, like name@example.com.";
  if (name === "phone")
    return "Enter a phone number with 6 to 20 digits. You can use +, spaces, brackets and dashes.";
  if (name === "country") return "Choose a country.";
  const tooLong = TOO_LONG[name];
  if (issueCode === "too_big" && tooLong) return tooLong;
  return "Check this field.";
}

export function issueField(
  kind: PartnerRequestKind,
  head: PropertyKey | undefined,
): PartnerFieldName | undefined {
  if (typeof head !== "string") return undefined;
  const name = head === "productCategories" ? "categories" : head;
  return isPartnerField(kind, name) ? name : undefined;
}

export type ValidationResult =
  { ok: true; request: CreatePartnerRequest } | { ok: false; errors: PartnerFieldErrors };

/** Checks the form with the contract's schema. Nothing invalid gets past here to the API. */
export function validatePartnerForm(
  kind: PartnerRequestKind,
  values: PartnerValues,
): ValidationResult {
  const result =
    kind === "brand"
      ? BrandRequestInputSchema.safeParse(rawBrandRequest(values))
      : CountryRequestInputSchema.safeParse(rawCountryRequest(values));
  if (result.success) return { ok: true, request: result.data };
  const errors: PartnerFieldErrors = {};
  for (const issue of result.error.issues) {
    const name = issueField(kind, issue.path[0]);
    if (!name || errors[name] !== undefined) continue;
    const empty =
      name === "categories"
        ? parseTags(text(values, name)).length === 0
        : text(values, name).trim() === "";
    errors[name] = fieldMessage(name, issue.code, empty);
  }
  return { ok: false, errors };
}

/** The first field with an error, in page order, so focus can move to it. */
export function firstInvalidField(
  fields: readonly PartnerFieldName[],
  errors: PartnerFieldErrors,
): PartnerFieldName | undefined {
  return fields.find((name) => errors[name] !== undefined);
}

/** The body sent to the API: the request plus the honeypot field (empty for real people). */
export function withHoneypot(
  request: CreatePartnerRequest,
  honeypotValue: string,
): CreatePartnerRequest & { [PARTNER_HONEYPOT_FIELD]: string } {
  return { ...request, [PARTNER_HONEYPOT_FIELD]: honeypotValue } as const;
}

/** Props of the hidden trap input: out of the tab order and hidden from screen readers. */
export const HONEYPOT_INPUT_PROPS = {
  name: PARTNER_HONEYPOT_FIELD,
  type: "text",
  tabIndex: -1,
  autoComplete: "off",
  "aria-hidden": true,
} as const;

/** Off screen, not display:none, so bots that skip hidden fields still see it. */
export const HONEYPOT_WRAPPER_STYLE: CSSProperties = {
  position: "absolute",
  left: "-10000px",
  width: "1px",
  height: "1px",
  overflow: "hidden",
};
