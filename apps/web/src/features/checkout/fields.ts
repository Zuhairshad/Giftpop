/** Names of every field on the checkout form. Ids in the page are `checkout-<name>`. */
export const CONTACT_FIELDS = ["name", "email", "phone"] as const;
export const ADDRESS_FIELDS = ["line1", "line2", "city", "region", "postalCode"] as const;
export const FIELD_ORDER = [...CONTACT_FIELDS, ...ADDRESS_FIELDS] as const;

export type ContactFieldName = (typeof CONTACT_FIELDS)[number];
export type AddressFieldName = (typeof ADDRESS_FIELDS)[number];
export type FieldName = (typeof FIELD_ORDER)[number];
export type FieldErrors = Partial<Record<FieldName, string>>;

export type ContactValues = Record<ContactFieldName, string>;
export type AddressValues = Record<AddressFieldName, string>;

export interface FormValues {
  contact: ContactValues;
  address: AddressValues;
}

export const EMPTY_FORM: FormValues = {
  contact: { name: "", email: "", phone: "" },
  address: { line1: "", line2: "", city: "", region: "", postalCode: "" },
};

export function isFieldName(value: string): value is FieldName {
  return (FIELD_ORDER as readonly string[]).includes(value);
}

export function isContactField(field: FieldName): field is ContactFieldName {
  return (CONTACT_FIELDS as readonly string[]).includes(field);
}

/** The first field with an error, in the order the form shows them. */
export function firstInvalidField(errors: FieldErrors): FieldName | null {
  return FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null;
}

export function fieldId(field: FieldName): string {
  return `checkout-${field}`;
}
