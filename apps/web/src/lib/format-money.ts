/**
 * Shows integer minor units as a price in the visitor's locale, for display only.
 * The number of decimals comes from the currency (2 for USD, 0 for JPY), never from the caller.
 * Never feed the result back into any calculation: the server owns money.
 */
export function formatMoney(amountMinor: number, currency: string, locale?: string): string {
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** digits);
}
