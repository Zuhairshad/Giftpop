import type { ReactElement, ReactNode } from "react";

import { BrandForm } from "./brand-form";
import { notLiveCountries, prefillCountry, sortByName } from "./countries";
import { CountryForm } from "./country-form";
import { loadCountries } from "./load-countries";

function Notice({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="bg-surface border-border shadow-pop rounded-blob mx-auto w-full max-w-2xl min-w-0 border p-5 sm:p-10">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="text-muted mt-3">{children}</p>
    </section>
  );
}

const LOAD_FAILED = "We could not load the list of countries. Please try again in a moment.";

export async function BrandPartnerForm(): Promise<ReactElement> {
  const result = await loadCountries();
  if (!result.ok) return <Notice title="Want your products in our gifts?">{LOAD_FAILED}</Notice>;
  return <BrandForm countries={sortByName(result.countries)} />;
}

export async function CountryPartnerForm({
  country,
}: {
  /** The raw `?country=` query value. */
  country?: string | string[];
}): Promise<ReactElement> {
  const result = await loadCountries();
  if (!result.ok) return <Notice title="Want The Giftpop in your country?">{LOAD_FAILED}</Notice>;
  const available = notLiveCountries(result.countries);
  if (available.length === 0) {
    return (
      <Notice title="Want The Giftpop in your country?">
        The Giftpop is already open in every country we know of, so there is nothing to request
        right now. Check back soon.
      </Notice>
    );
  }
  return <CountryForm countries={available} initialCountry={prefillCountry(country, available)} />;
}
