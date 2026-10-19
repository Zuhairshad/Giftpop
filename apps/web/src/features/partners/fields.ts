import type { PartnerRequestKind } from "@giftpop/contracts";

export const BRAND_FIELDS = [
  "brandName",
  "contactName",
  "email",
  "phone",
  "country",
  "categories",
  "link",
  "message",
] as const;

export const COUNTRY_FIELDS = [
  "country",
  "contactName",
  "email",
  "phone",
  "offering",
  "message",
] as const;

export type BrandFieldName = (typeof BRAND_FIELDS)[number];
export type CountryFieldName = (typeof COUNTRY_FIELDS)[number];
export type PartnerFieldName = BrandFieldName | CountryFieldName;

export type PartnerValues = Partial<Record<PartnerFieldName, string>>;
export type PartnerFieldErrors = Partial<Record<PartnerFieldName, string>>;

/** The fields of each form, in the order they appear (and the order focus moves to on errors). */
export function fieldsFor(kind: PartnerRequestKind): readonly PartnerFieldName[] {
  return kind === "brand" ? BRAND_FIELDS : COUNTRY_FIELDS;
}

export function isPartnerField(kind: PartnerRequestKind, value: string): value is PartnerFieldName {
  return (fieldsFor(kind) as readonly string[]).includes(value);
}

/** The id of a control in the page, unique per form. */
export function partnerFieldId(kind: PartnerRequestKind, name: PartnerFieldName): string {
  return `partner-${kind}-${name}`;
}

export function emptyValues(kind: PartnerRequestKind, country = ""): PartnerValues {
  const values: PartnerValues = {};
  for (const name of fieldsFor(kind)) values[name] = name === "country" ? country : "";
  return values;
}

export const MAX_CATEGORIES = 20;
export const MAX_CATEGORY_LENGTH = 40;
