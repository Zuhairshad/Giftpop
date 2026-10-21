import type { PublicTemplate } from "@giftpop/contracts";

import { formatMoney } from "@/lib/format";

/** What the public list said about one template in one country. */
export type CountryPrice =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; shown: PublicTemplate | null };

export interface PriceLine {
  tone: "price" | "hidden" | "error" | "loading";
  text: string;
}

/** Finds a template in a public list by id. The price is whatever the API computed. */
export function findPublicTemplate(
  list: readonly PublicTemplate[],
  templateId: string,
): PublicTemplate | null {
  return list.find((entry) => entry.id === templateId) ?? null;
}

/**
 * The sentence under a listed country: the price customers see there ("PKR 4,500.00"), or the
 * plain reason it is not shown. Never computes a price: it only formats what the API sent.
 */
export function priceLine(input: {
  countryCode: string;
  countryName: string;
  /** Whether staff switched the template on; it explains a hidden gift. */
  templateActive: boolean;
  price: CountryPrice;
}): PriceLine {
  const { countryCode, countryName, templateActive, price } = input;
  if (price.state === "loading") return { tone: "loading", text: `Checking ${countryName}…` };
  if (price.state === "error") {
    return { tone: "error", text: `Could not check ${countryName}: ${price.message}` };
  }
  if (price.shown) {
    const amount = formatMoney(price.shown.priceMinor, price.shown.currency);
    return { tone: "price", text: `${amount} in ${countryName}` };
  }
  const why = templateActive
    ? "an item has no price or stock there, or the gift no longer fits its packaging"
    : "this template is hidden";
  return { tone: "hidden", text: `Not shown in ${countryCode}: ${why}` };
}
