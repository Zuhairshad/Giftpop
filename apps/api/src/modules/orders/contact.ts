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
  return digits.length >= 6 && digits === normalisePhone(stored.phone);
}
