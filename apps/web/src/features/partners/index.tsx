import type { ReactElement, ReactNode } from "react";

import { BrandForm } from "./brand-form";
import { notLiveCountries, prefillCountry, sortByName } from "./countries";
import { CountryForm } from "./country-form";
import { loadCountries } from "./load-countries";

import { StatePanel } from "@/components/placeholder-page";
import { INSTAGRAM_URL } from "@/components/site-footer";
import { ButtonLink, buttonClass } from "@/components/ui";
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
    // The request contract needs a country from our list, and every listed one is open, so the
    // form could not be sent. Point to a real next step instead of a dead end.
    return (
      <StatePanel
        headingId="partner-notice-heading"
        title="Want The Giftpop in your country?"
        role="status"
        actions={
          <>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message us on Instagram, opens in a new tab"
              className={buttonClass()}
            >
              Message us on Instagram
            </a>
            <ButtonLink href="/countries" variant="tint">
              See where we deliver
            </ButtonLink>
          </>
        }
      >
        Every country on our list is open already. If yours is not on it yet, tell us where you are
        and what you could offer: we add a country as soon as we find someone local to make the
        gifts.
      </StatePanel>
    );
  }
  return <CountryForm countries={available} initialCountry={prefillCountry(country, available)} />;
}
