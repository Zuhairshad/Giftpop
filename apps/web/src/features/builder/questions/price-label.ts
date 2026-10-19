import { formatMoney } from "@/lib/format-money";

/**
 * A fixed locale keeps the server render and the browser render identical, so prices
 * never cause a hydration mismatch. Display only; the amount comes from the catalog.
 */
const DISPLAY_LOCALE = "en";

export function priceLabel(amountMinor: number, currency: string): string {
  return formatMoney(amountMinor, currency, DISPLAY_LOCALE);
}
