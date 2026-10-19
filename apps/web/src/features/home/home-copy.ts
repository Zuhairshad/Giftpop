import type { CountryCode, PublicCountry } from "@giftpop/contracts";

/** The h1, split so the country name can wear the lavender marker. `highlight` is null on the generic home. */
export type HomeHeadline = { before: string; highlight: string | null };

const GENERIC_HEADLINE = "Handmade gift boxes & bouquets, made by hand";
const HEADLINE_LEAD = "Handmade gift boxes & bouquets in ";

export const HOME_EYEBROW = "made by hand, with love";
export const HOME_LEDE =
  "Pick the box, fill it with things they love, add a name. We make it and send it.";

/** The name shown for a country: the document's name, or the code from the URL when the API is unavailable. */
export function countryDisplayName(
  code: CountryCode,
  country: Pick<PublicCountry, "name"> | null,
): string {
  return country?.name ?? code;
}

/** `/` has no country yet (`name` is undefined); `/<cc>` names the country from its document. */
export function homeHeadline(name?: string): HomeHeadline {
  return name
    ? { before: HEADLINE_LEAD, highlight: name }
    : { before: GENERIC_HEADLINE, highlight: null };
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
      title: GENERIC_HEADLINE,
      description:
        "Pick the box, fill it with things they love, add a name. Every gift is made and packed by hand. Choose your country to start.",
      path: "/",
    };
  }
  return {
    title: `${HEADLINE_LEAD}${input.name}`,
    description: `Build a handmade gift box or bouquet to send in ${input.name}. Pick the box, choose what goes inside, add a name. We make it by hand and send it.`,
    path: `/${input.code.toLowerCase()}`,
  };
}
