import type { CountryCode, PublicCountry } from "@giftpop/contracts";

/*
 * Eyebrow, h1, lede and ticks each say something different: a feeling, what we sell (and where),
 * how it works, and the facts. "Handmade" lives in the h1 and "Made by hand" only as a tick.
 */
export const HOME_HEADLINE = "Handmade gift boxes & bouquets, delivered";

export const HOME_EYEBROW = "a little joy in a box";
export const HOME_LEDE =
  "Pick the box, fill it with things they love, add a name. We make it and send it.";

/** The name shown for a country: the document's name, or the code from the URL when the API is unavailable. */
export function countryDisplayName(
  code: CountryCode,
  country: Pick<PublicCountry, "name"> | null,
): string {
  return country?.name ?? code;
}

/** How we work, true in every country. */
const ALWAYS_TICKS = ["Made by hand", "Packed with care"];

/** "3 to 5 day delivery". Zero-day ranges get honest copy instead of "0 to 0 day". */
export function deliveryTick(days: { min: number; max: number }): string {
  const { min, max } = days;
  if (max <= 0) return "Same day delivery";
  if (min === max) return `${max} day delivery`;
  if (min <= 0) return `Delivery within ${max} ${max === 1 ? "day" : "days"}`;
  return `${min} to ${max} day delivery`;
}

type TickSource = Pick<PublicCountry, "shipping" | "paymentModes">;

/** Ticks that come from the country document. Empty when the document is missing. */
export function countryTicks(country: TickSource | null): string[] {
  if (!country) return [];
  const ticks = [deliveryTick(country.shipping.deliveryDays)];
  if (country.paymentModes.includes("cod")) ticks.push("Cash on delivery");
  return ticks;
}

export function homeTicks(country: TickSource | null): string[] {
  return [...ALWAYS_TICKS, ...countryTicks(country)];
}

export type HomeMeta = { title: string; description: string; path: string };

/** Metadata text for `/` (no `name`) and `/<cc>` (`code` and `name`). */
export function homeMeta(input: { code?: CountryCode; name?: string }): HomeMeta {
  if (!input.code || !input.name) {
    return {
      title: HOME_HEADLINE,
      description:
        "Pick the box, fill it with things they love, add a name. Every gift is made and packed by hand. Choose your country to start.",
      path: "/",
    };
  }
  return {
    title: `Handmade gift boxes & bouquets in ${input.name}`,
    description: `Build a handmade gift box or bouquet to send in ${input.name}. Pick the box, choose what goes inside, add a name. We make it by hand and send it.`,
    path: `/${input.code.toLowerCase()}`,
  };
}
