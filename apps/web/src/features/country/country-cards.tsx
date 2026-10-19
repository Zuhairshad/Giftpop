import type { PublicCountry } from "@giftpop/contracts";

import { ChooseCountryLink } from "./choose-country-link";
import { deliveryEstimate } from "./delivery-copy";
import { flagEmoji } from "./flag";

import { ButtonLink } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";

const CARD = "bg-surface shadow-hairline flex min-w-0 items-center gap-4 rounded-lg p-4 sm:p-5";
const FLAG_WELL =
  "bg-warm flex size-16 flex-none items-center justify-center rounded-md text-4xl leading-none";

/** A country we ship to. The whole card is the link, and it remembers the choice. */
export function LiveCountryCard({ country }: { country: PublicCountry }) {
  return (
    <li>
      <ChooseCountryLink
        code={country.code}
        className={`${CARD} hover:shadow-lift hover:bg-warm h-full transition-colors`}
      >
        <span aria-hidden="true" className={FLAG_WELL}>
          {flagEmoji(country.code)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display text-foreground block text-xl leading-tight font-bold tracking-tight wrap-anywhere">
            {country.name}
          </span>
          <span className="text-muted mt-0.5 block text-sm">
            {country.currency} · {deliveryEstimate(country.shipping.deliveryDays)}
          </span>
          <span className="text-muted block text-sm">
            Shipping from {formatMoney(country.shipping.flatMinor, country.currency, "en")}
          </span>
          <span className="bg-pink-soft text-pink-strong mt-3 inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold">
            Shop in {country.name} →
          </span>
        </span>
      </ChooseCountryLink>
    </li>
  );
}

/** A country that is not open yet, with a way to ask us to open it. */
export function ComingSoonCountryCard({ country }: { country: PublicCountry }) {
  return (
    <li className={`${CARD} flex-wrap`}>
      <span aria-hidden="true" className={`${FLAG_WELL} size-14 text-3xl opacity-70`}>
        {flagEmoji(country.code)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display text-foreground block text-lg leading-tight font-bold tracking-tight wrap-anywhere">
          {country.name}
        </span>
        <span className="bg-lavender text-lavender-deep mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold">
          Coming soon
        </span>
      </span>
      <ButtonLink
        href={`/partners/countries?country=${encodeURIComponent(country.code)}`}
        variant="tint"
        size="sm"
        className="whitespace-normal"
      >
        Bring The Giftpop here
        <span className="sr-only"> to {country.name}</span>
      </ButtonLink>
    </li>
  );
}
