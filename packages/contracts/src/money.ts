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

/**
 * ISO 4217 currencies whose minor unit is not 2 digits. Every launch currency uses 2.
 * This is the standard's table, not CLDR's display digits: CLDR 48 shows PKR with 0
 * decimals, but PKR prices are stored in paisa (2 digits), so asking `Intl` would
 * show them 100 times too high.
 */
const NON_DEFAULT_MINOR_DIGITS: Readonly<Record<string, number>> = {
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
};

/** How many digits the minor unit of `currency` has (2 for USD and PKR, 0 for JPY). */
export function minorDigits(currency: CurrencyCode): number {
  return NON_DEFAULT_MINOR_DIGITS[currency] ?? 2;
}

function assertMinor(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Expected an integer amount in minor units, got ${value}`);
  }
}

export function money(amountMinor: number, currency: CurrencyCode): Money {
  assertMinor(amountMinor);
  // `+ 0` turns -0 into 0 so amounts never serialise or compare as negative zero.
  return { amountMinor: amountMinor + 0, currency };
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

const PLAIN_AMOUNT = /^(\d*)(?:\.(\d*))?$/;
const GROUPED_AMOUNT = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;

/**
 * Turns typed major units ("12.50", "1,200") into integer minor units of `currency`
 * (1250, 120000; "500" yen is 500). Works on the decimal string, never on a float, and
 * never rounds: more decimals than the currency has is rejected. Returns null for anything
 * that is not a non-negative amount.
 */
export function majorToMinor(input: string, currency: CurrencyCode): number | null {
  const digits = minorDigits(currency);
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const text = GROUPED_AMOUNT.test(trimmed) ? trimmed.replaceAll(",", "") : trimmed;

  const match = PLAIN_AMOUNT.exec(text);
  if (!match) return null;
  const whole = match[1] ?? "";
  const fraction = match[2] ?? "";
  if (whole === "" && fraction === "") return null;
  if (fraction.length > digits) return null;

  const wholeUnits = whole === "" ? 0 : Number(whole);
  const kept = digits === 0 ? 0 : Number(fraction.padEnd(digits, "0"));
  const minor = wholeUnits * 10 ** digits + kept;
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Integer minor units as a plain major-unit string ("1250" USD is "12.50", 500 JPY is "500"). */
export function minorToMajor(minor: number, currency: CurrencyCode): string {
  assertMinor(minor);
  const digits = minorDigits(currency);
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  if (digits === 0) return `${sign}${abs}`;
  const factor = 10 ** digits;
  const fraction = String(abs % factor).padStart(digits, "0");
  return `${sign}${Math.floor(abs / factor)}.${fraction}`;
}
