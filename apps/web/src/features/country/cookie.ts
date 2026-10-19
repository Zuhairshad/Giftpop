import { CountryCodeSchema } from "@giftpop/contracts";
import type { CountryCode } from "@giftpop/contracts";

/** Remembers the visitor's country. Not a secret: it only picks which store to show. */
export const COUNTRY_COOKIE = "gp_country";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Returns the upper-case code when `value` is one, otherwise null. Lower case is not accepted. */
export function validCountryCode(value: string | null | undefined): CountryCode | null {
  if (!value) return null;
  const result = CountryCodeSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Reads `gp_country` from a `Cookie` header or `document.cookie` string. */
export function parseCountryCookie(cookieHeader: string | null | undefined): CountryCode | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== COUNTRY_COOKIE) continue;
    return validCountryCode(part.slice(index + 1).trim());
  }
  return null;
}

/** The `document.cookie` assignment string for a chosen country. Throws on an invalid code. */
export function serializeCountryCookie(code: string): string {
  const valid = validCountryCode(code);
  if (!valid) throw new Error(`Not a country code: ${code}`);
  return `${COUNTRY_COOKIE}=${valid}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/** The country in the first URL segment (`/pk/build/format` gives PK), or null. */
export function countryFromPath(pathname: string): CountryCode | null {
  const first = pathname.split("/")[1] ?? "";
  if (!/^[a-z]{2}$/i.test(first)) return null;
  return validCountryCode(first.toUpperCase());
}
