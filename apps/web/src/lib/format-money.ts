import { minorDigits } from "@giftpop/contracts";

/**
 * Shows integer minor units as a price in the visitor's locale, for display only.
 * The number of decimals comes from the currency (2 for USD, 0 for JPY), never from the caller.
 * Never feed the result back into any calculation: the server owns money.
 */
export function formatMoney(amountMinor: number, currency: string, locale?: string): string {
  // Digits come from ISO 4217 (contracts), and are pinned so Intl never rounds for display.
  const digits = minorDigits(currency);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(amountMinor / 10 ** digits);
}
