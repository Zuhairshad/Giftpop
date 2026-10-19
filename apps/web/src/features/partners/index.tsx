import type { ReactElement, ReactNode } from "react";

import { BrandForm } from "./brand-form";
import { notLiveCountries, prefillCountry, sortByName } from "./countries";
import { CountryForm } from "./country-form";
import { loadCountries } from "./load-countries";

import { StatePanel } from "@/components/placeholder-page";
import { ButtonLink } from "@/components/ui";
import { RetryButton } from "@/features/country/retry-button";

function Notice({
  title,
  children,
  retry = false,
}: {
  title: string;
  children: ReactNode;
  retry?: boolean;
}): ReactElement {
  return (
    <StatePanel
      headingId="partner-notice-heading"
      title={title}
      role={retry ? "alert" : "status"}
      actions={
        <>
          {retry ? <RetryButton /> : null}
          <ButtonLink href="/partners" variant={retry ? "ghost" : "primary"}>
            Back to partnerships
          </ButtonLink>
        </>
      }
    >
      {children}
    </StatePanel>
  );
}

const LOAD_FAILED = "We could not load the list of countries. Please try again in a moment.";

export async function BrandPartnerForm(): Promise<ReactElement> {
  const result = await loadCountries();
  if (!result.ok)
    return (
      <Notice title="Want your products in our gifts?" retry>
        {LOAD_FAILED}
      </Notice>
    );
  return <BrandForm countries={sortByName(result.countries)} />;
}

export async function CountryPartnerForm({
  country,
}: {
  /** The raw `?country=` query value. */
  country?: string | string[];
}): Promise<ReactElement> {
  const result = await loadCountries();
  if (!result.ok)
    return (
      <Notice title="Want The Giftpop in your country?" retry>
        {LOAD_FAILED}
      </Notice>
    );
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
