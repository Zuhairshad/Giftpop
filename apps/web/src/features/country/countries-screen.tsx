import type { PublicCountry } from "@giftpop/contracts";

import { ComingSoonCountryCard, LiveCountryCard } from "./country-cards";
import { fetchCountriesOrThrow } from "./fetch-countries";
import { groupCountries } from "./group";
import { RetryButton } from "./retry-button";

import { StatePanel } from "@/components/placeholder-page";
import { ButtonLink } from "@/components/ui";

export async function CountriesScreen() {
  let countries: PublicCountry[] | null = null;
  try {
    countries = await fetchCountriesOrThrow();
  } catch {
    countries = null;
  }

  if (countries === null) {
    return (
      <StatePanel
        role="alert"
        script="Hang on"
        title="We could not load the country list"
        actions={
          <>
            <RetryButton />
            <ButtonLink href="/" variant="ghost">
              Go to the home page
            </ButtonLink>
          </>
        }
      >
        Check your connection, then try again. If it keeps happening, come back in a few minutes.
      </StatePanel>
    );
  }

  return (
    <div className="space-y-10">
      <header className="max-w-3xl space-y-2">
        <p
          aria-hidden="true"
          className="font-script text-lavender-deep text-2xl leading-none font-bold"
        >
          Pick your country
        </p>
        <h1 className="font-display text-foreground text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          Where should we send your gift?
        </h1>
        <p className="text-muted text-lg">
          Each country has its own gifts, prices and delivery times. Pick yours to start building.
        </p>
      </header>
      <CountryLists countries={countries} />
    </div>
  );
}

function CountryLists({ countries }: { countries: PublicCountry[] }) {
  const { live, comingSoon } = groupCountries(countries);
  return (
    <>
      <section aria-labelledby="live-countries" className="space-y-4">
        <h2
          id="live-countries"
          className="font-display text-foreground text-2xl font-bold tracking-tight"
        >
          We ship to
        </h2>
        {live.length === 0 ? (
          <div className="bg-warm rounded-lg p-5">
            <p className="text-foreground font-semibold">No countries are open yet.</p>
            <p className="text-muted mt-1 text-sm">
              Check back soon, or ask us to open yours below. If this looks wrong, try again.
            </p>
            <div className="mt-4">
              <RetryButton />
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {live.map((country) => (
              <LiveCountryCard key={country.code} country={country} />
            ))}
          </ul>
        )}
      </section>

      {comingSoon.length > 0 ? (
        <section aria-labelledby="coming-soon-countries" className="space-y-4">
          <h2
            id="coming-soon-countries"
            className="font-display text-foreground text-2xl font-bold tracking-tight"
          >
            Coming soon
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comingSoon.map((country) => (
              <ComingSoonCountryCard key={country.code} country={country} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
