import { majorToMinor, minorToMajor, UpdateCountryRequestSchema } from "@giftpop/contracts";
import type { Country, UpdateCountryRequest } from "@giftpop/contracts";

export type CountryFormValues = Country;

/** Payment modes in the order the form lists them. */
export const PAYMENT_MODE_OPTIONS = [
  { value: "prepaid", label: "Pay in full now" },
  { value: "cod", label: "Cash on delivery (advance now)" },
] as const;

export function emptyCountryValues(): CountryFormValues {
  return {
    code: "",
    name: "",
    currency: "",
    status: "coming_soon",
    paymentModes: ["prepaid", "cod"],
    shipping: { flatMinor: 0, deliveryDays: { min: 2, max: 5 } },
    addressFormat: {
      region: { required: false, label: "Region" },
      postalCode: { required: true, label: "Postcode" },
    },
    paymentInstructions: "",
  };
}

/** The PUT body: everything except `code`, which names the country in the URL (the schema drops it). */
export function toUpdateCountryRequest(values: CountryFormValues): UpdateCountryRequest {
  return UpdateCountryRequestSchema.parse(values);
}

/** Money fields for display. Used to seed the money inputs. */
export function minorToInput(minor: number | undefined, currency: string): string {
  return minor === undefined || !Number.isSafeInteger(minor) ? "" : minorToMajor(minor, currency);
}

/** Parses a money input. Empty is `undefined`, invalid is `NaN` (the schema then rejects it). */
export function inputToMinor(text: string, currency: string): number | undefined {
  if (text.trim() === "") return undefined;
  return majorToMinor(text, currency) ?? Number.NaN;
}

export function toggleMode<T extends string>(modes: readonly T[], mode: T, on: boolean): T[] {
  const without = modes.filter((existing) => existing !== mode);
  return on ? [...without, mode] : without;
}

/** Flag emoji for an ISO 3166-1 alpha-2 code. Anything else gives a globe. */
export function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "\u{1F310}";
  return [...code.toUpperCase()]
    .map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65))
    .join("");
}
