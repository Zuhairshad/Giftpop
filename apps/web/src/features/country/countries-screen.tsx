import type { PublicCountry } from "@giftpop/contracts";
import Link from "next/link";

import { ChooseCountryLink } from "./choose-country-link";
import { deliveryEstimate } from "./delivery-copy";
import { fetchCountriesOrThrow } from "./fetch-countries";
import { flagEmoji } from "./flag";
import { groupCountries } from "./group";

import { formatMoney } from "@/lib/format-money";

const CARD =
  "border-border bg-surface rounded-card shadow-pop flex min-w-0 items-center gap-4 border p-4 sm:p-5";

function LiveCard({ country }: { country: PublicCountry }) {
  return (
    <li>
      <ChooseCountryLink
        code={country.code}
        className={`${CARD} hover:bg-surface-soft transition-colors`}
      >
        <span aria-hidden="true" className="text-5xl leading-none">
          {flagEmoji(country.code)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display text-foreground block text-xl font-bold wrap-anywhere">
            {country.name}
          </span>
          <span className="text-muted block text-sm">
            {country.currency} · {deliveryEstimate(country.shipping.deliveryDays)}
          </span>
          <span className="text-muted block text-sm">
            Shipping from {formatMoney(country.shipping.flatMinor, country.currency, "en")}
          </span>
        </span>
        <span className="text-pink-strong shrink-0 text-sm font-bold">
          Shop<span className="sr-only"> in {country.name}</span> →
        </span>
      </ChooseCountryLink>
    </li>
  );
}

function ComingSoonCard({ country }: { country: PublicCountry }) {
  return (
    <li className={`${CARD} flex-wrap`}>
      <span aria-hidden="true" className="text-4xl leading-none opacity-70">
        {flagEmoji(country.code)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display text-foreground block text-lg font-bold wrap-anywhere">
          {country.name}
        </span>
        <span className="text-muted block text-sm">Coming soon</span>
      </span>
      <Link
        href={`/partners/countries?country=${encodeURIComponent(country.code)}`}
        className="border-border text-pink-strong hover:bg-surface-soft rounded-full border px-4 py-1.5 text-sm font-bold transition-colors"
      >
        Bring The Giftpop here
        <span className="sr-only"> to {country.name}</span>
      </Link>
    </li>
  );
}

export async function CountriesScreen() {
  let countries: PublicCountry[] | null = null;
  try {
    countries = await fetchCountriesOrThrow();
  } catch {
    countries = null;
  }

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-foreground text-3xl font-bold sm:text-4xl">
          Where should we send your gift?
        </h1>
        <p className="text-muted">
          Each country has its own gifts, prices and delivery times. Pick yours to start building.
        </p>
      </header>

      {countries === null ? (
        <p role="alert" className="bg-surface-soft text-foreground rounded-card p-4">
          We could not load the country list. Refresh the page to try again.
        </p>
      ) : (
        <CountryLists countries={countries} />
      )}
    </div>
  );
}

function CountryLists({ countries }: { countries: PublicCountry[] }) {
  const { live, comingSoon } = groupCountries(countries);
  return (
    <>
      <section aria-labelledby="live-countries" className="space-y-4">
        <h2 id="live-countries" className="font-display text-foreground text-2xl font-bold">
          We ship to
        </h2>
        {live.length === 0 ? (
          <p className="text-muted">No countries are open yet. Check back soon.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {live.map((country) => (
              <LiveCard key={country.code} country={country} />
            ))}
          </ul>
        )}
      </section>

      {comingSoon.length > 0 ? (
        <section aria-labelledby="coming-soon-countries" className="space-y-4">
          <h2
            id="coming-soon-countries"
            className="font-display text-foreground text-2xl font-bold"
          >
            Coming soon
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {comingSoon.map((country) => (
              <ComingSoonCard key={country.code} country={country} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
