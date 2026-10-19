import { cookies, headers } from "next/headers";

import { COUNTRY_COOKIE, validCountryCode } from "./cookie";
import { CountryPicker } from "./country-picker";
import { CountrySuggestion } from "./country-suggestion";
import { fetchCountries } from "./fetch-countries";
import { groupCountries } from "./group";
import { suggestCountry } from "./suggest";

/** The header's country pill and picker. Reads the cookie and the countries list on the server. */
export async function HeaderCountryPicker() {
  const [countries, cookieStore] = await Promise.all([fetchCountries(), cookies()]);
  const cookieCode = validCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value);
  const { live } = groupCountries(countries);
  return (
    <CountryPicker
      countries={live.map(({ code, name }) => ({ code, name }))}
      allCountries={countries.map(({ code, name }) => ({ code, name }))}
      cookieCode={cookieCode}
    />
  );
}

/** Suggests a country from `Accept-Language` to a visitor with no cookie. Never uses their IP. */
export async function HeaderCountrySuggestion() {
  const cookieStore = await cookies();
  if (validCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value)) return null;

  const [countries, requestHeaders] = await Promise.all([fetchCountries(), headers()]);
  const { live } = groupCountries(countries);
  const code = suggestCountry(
    requestHeaders.get("accept-language"),
    live.map((country) => country.code),
  );
  const match = live.find((country) => country.code === code);
  return match ? <CountrySuggestion code={match.code} name={match.name} /> : null;
}
