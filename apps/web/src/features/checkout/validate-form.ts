import { AddressSchema, ContactSchema, validateAddress } from "@giftpop/contracts";
import type { Address, AddressFormat, Contact } from "@giftpop/contracts";
import type { z } from "zod";

import { withDialCode } from "./dial-codes";
import { isFieldName } from "./fields";
import type { FieldErrors, FieldName, FormValues } from "./fields";

const REQUIRED: Partial<Record<FieldName, string>> = {
  name: "Enter your name",
  email: "Enter your email address",
  phone: "Enter your phone number",
  line1: "Enter the first line of the address",
  city: "Enter the city",
};
const INVALID: Partial<Record<FieldName, string>> = {
  email: "Enter a valid email address, like name@example.com",
  phone: "Enter a valid phone number, using digits only",
};

function issueMessage(field: FieldName, empty: boolean, tooLong: boolean): string {
  if (empty) return REQUIRED[field] ?? "Fill in this field";
  if (tooLong) return "This is too long. Shorten it.";
  return INVALID[field] ?? "Check this field";
}

function typedValue(values: FormValues, field: FieldName): string {
  if (field === "name" || field === "email" || field === "phone") return values.contact[field];
  return values.address[field];
}

function collect(
  issues: readonly z.core.$ZodIssue[],
  values: FormValues,
  errors: FieldErrors,
): void {
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (!isFieldName(field) || errors[field]) continue;
    errors[field] = issueMessage(
      field,
      typedValue(values, field).trim() === "",
      issue.code === "too_big",
    );
  }
}

export interface ParsedForm {
  contact: Contact;
  address: Address;
}

export type FormCheck = { ok: true; value: ParsedForm } | { ok: false; errors: FieldErrors };

function blank(text: string): string | undefined {
  return text.trim() === "" ? undefined : text;
}

/** The address as the API takes it: empty optional fields are left out. */
export function toAddressInput(address: FormValues["address"]): unknown {
  return {
    line1: address.line1,
    line2: blank(address.line2),
    city: address.city,
    region: blank(address.region),
    postalCode: blank(address.postalCode),
  };
}

/** The contact as the API takes it, with the dial code put in front of the typed phone. */
export function toContactInput(contact: FormValues["contact"], dialCode: string | null): unknown {
  return { ...contact, phone: withDialCode(dialCode, contact.phone) };
}

/**
 * Checks the whole form with the contract schemas and the country's address rules.
 * Returns plain, field-level messages; never raw zod text.
 */
export function checkForm(
  values: FormValues,
  format: AddressFormat,
  dialCode: string | null,
): FormCheck {
  const errors: FieldErrors = {};
  const contact = ContactSchema.safeParse(toContactInput(values.contact, dialCode));
  if (!contact.success) collect(contact.error.issues, values, errors);

  const address = AddressSchema.safeParse(toAddressInput(values.address));
  if (!address.success) collect(address.error.issues, values, errors);
  // Region and postal code rules come from the country, so they are checked even when other fields fail.
  const typed = {
    line1: values.address.line1,
    city: values.address.city,
    region: blank(values.address.region),
    postalCode: blank(values.address.postalCode),
  };
  for (const problem of validateAddress(typed, format)) {
    errors[problem.field] ??= problem.message;
  }

  if (contact.success && address.success && Object.keys(errors).length === 0) {
    return { ok: true, value: { contact: contact.data, address: address.data } };
  }
  return { ok: false, errors };
}
