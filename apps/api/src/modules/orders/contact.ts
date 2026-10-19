import type { Contact } from "@giftpop/contracts";

/** Digits only, so "+92 300-1234567" and "923001234567" are the same phone. */
export function normalisePhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Whether what a customer typed (a phone or an email) is the contact the order was
 * placed with. Customers have no accounts, so this plus the order number is the
 * only proof they hold. Callers must answer a mismatch exactly like an unknown
 * order, so a number cannot be probed.
 */
export function contactMatches(stored: Contact, typed: string): boolean {
  const input = typed.trim();
  if (input.includes("@")) return normaliseEmail(input) === normaliseEmail(stored.email);
  const digits = normalisePhone(input);
  if (digits.length < 6) return false;
  const storedDigits = normalisePhone(stored.phone);
  if (digits === storedDigits) return true;
  // Checkout stores the phone with its country code ("+92 300 1234567"); customers
  // often type it the national way ("0300 1234567"). Accept that: the typed digits,
  // without the trunk zero, must be the whole stored number after a country code of
  // at most 4 digits, and long enough that a short tail cannot match.
  const national = digits.replace(/^0+/, "");
  return (
    national.length >= 7 &&
    storedDigits.length - national.length >= 1 &&
    storedDigits.length - national.length <= 4 &&
    storedDigits.endsWith(national)
  );
}
