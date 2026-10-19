import { minorDigits } from "@giftpop/contracts";

/** How many decimals to show: none on a whole amount, otherwise the currency's ISO 4217 minor digits. */
export function displayFractionDigits(amountMinor: number, currency: string): number {
  const digits = minorDigits(currency);
  return amountMinor % 10 ** digits === 0 ? 0 : digits;
}

/**
 * Shows integer minor units as a price in the visitor's locale, for display only.
 * A whole amount shows no decimals (PKR 12,320); any other shows the currency's minor digits
 * (PKR 12,320.50, KWD 1.250). The digits come from the currency, never from the caller or from Intl.
 * Never feed the result back into any calculation: the server owns money.
 */
export function formatMoney(amountMinor: number, currency: string, locale?: string): string {
  const digits = minorDigits(currency);
  // Pinned both ways so Intl never rounds: 0 is only used when the minor part is exactly zero.
  const shown = displayFractionDigits(amountMinor, currency);
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: shown,
    maximumFractionDigits: shown,
  });
  return formatter.format(amountMinor / 10 ** digits);
}
