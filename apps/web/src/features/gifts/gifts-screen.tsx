import type { CountryCode } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { CategoryChips } from "./category-chips";
import { fetchGifts } from "./fetch-gifts";
import { GiftCard } from "./gift-card";
import {
  categoryChips,
  categoryParam,
  filterByCategory,
  giftCountLabel,
  giftsHref,
} from "./gifts-model";
import { GiftsEmpty, GiftsUnavailable, NoGiftsInCategory } from "./gifts-states";

import { ButtonLink } from "@/components/ui";

/**
 * `/<cc>/gifts`: the country's ready-made gifts. The whole list is fetched once; the chips come
 * from its categories and `?category=` filters it here on the server. An API outage shows an
 * error panel in place of the grid, never a thrown 500.
 */
export async function GiftsScreen({
  country,
  category,
}: {
  country: CountryCode;
  category?: string | string[] | undefined;
}): Promise<ReactElement> {
  const result = await fetchGifts(country);
  const slug = categoryParam(category);

  if (!result.ok) return <GiftsUnavailable href={giftsHref(country, slug)} />;

  const chips = categoryChips(result.templates);
  const shown = filterByCategory(result.templates, slug);
  const chosen = chips.find((chip) => chip.slug === slug);

  if (result.templates.length === 0) {
    return (
      <GiftsEmpty title="No ready-made gifts here yet" actions={<BuildLink country={country} />}>
        We have not listed any finished gifts for this country yet. You can still build your own,
        piece by piece.
      </GiftsEmpty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p
          aria-hidden="true"
          className="font-script text-lavender-deep text-2xl leading-none font-bold"
        >
          Ready to go
        </p>
        <h1 className="font-display text-3xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-4xl">
          Ready-made gifts
        </h1>
        <p className="text-muted max-w-xl text-base">
          Finished gifts we make and send by hand. Pick one, add your card message, and order.
        </p>
      </header>

      <CategoryChips country={country} chips={chips} selected={slug} allSelected={slug === null} />

      {shown.length === 0 ? (
        <NoGiftsInCategory allHref={giftsHref(country)} />
      ) : (
        <section aria-label={chosen ? `${chosen.name} gifts` : "All gifts"}>
          <p className="text-muted mb-4 text-sm">
            {giftCountLabel(shown.length)}
            {chosen ? ` for ${chosen.name}` : ""}
          </p>
          <ul className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 sm:gap-6">
            {shown.map((template) => (
              <li key={template.id} className="min-w-0">
                <GiftCard
                  country={country}
                  template={template}
                  headingId={`gift-${template.id}-title`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BuildLink({ country }: { country: CountryCode }): ReactElement {
  return <ButtonLink href={`/${country.toLowerCase()}/build`}>Build your gift</ButtonLink>;
}
