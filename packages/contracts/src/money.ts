import { z } from "zod";

/** ISO 4217 alpha code, upper case. */
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/, "Invalid currency code");
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

/** Integer minor units (cents, paisa, halala). Never a float. */
export const MinorUnitsSchema = z.number().int().safe();

export const MoneySchema = z.object({
  amountMinor: MinorUnitsSchema,
  currency: CurrencyCodeSchema,
});
export type Money = z.infer<typeof MoneySchema>;

function assertMinor(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected an integer amount in minor units, got ${value}`);
  }
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  assertMinor(amountMinor);
  return { amountMinor, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new RangeError(`Currency mismatch: ${a.currency} and ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

export function multiplyMoney(a: Money, quantity: number): Money {
  assertMinor(quantity);
  return money(a.amountMinor * quantity, a.currency);
}

export function sumMoney(amounts: readonly Money[], currency: CurrencyCode): Money {
  return amounts.reduce((total, next) => addMoney(total, next), money(0, currency));
}

/**
 * `percent` of `amountMinor`, as integer minor units, rounded half up
 * (0.5 rounds toward +infinity). `percent` must be an integer from 0 to 100.
 * This is the only place in the codebase that rounds money.
 */
export function percentOfMinor(amountMinor: number, percent: number): number {
  assertMinor(amountMinor);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
    throw new RangeError(`Percent must be an integer from 0 to 100, got ${percent}`);
  }
  return Math.floor((amountMinor * percent + 50) / 100);
}

export function percentOfMoney(amount: Money, percent: number): Money {
  return money(percentOfMinor(amount.amountMinor, percent), amount.currency);
}
