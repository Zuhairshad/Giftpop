import type { CountryCode } from "@giftpop/contracts";

import { ChooseCountry } from "./choose-country";
import { FeaturedTemplates } from "./featured-templates";
import { fetchCatalog, fetchCountry, fetchTemplates } from "./fetch-home-data";
import { FormatStrip } from "./format-strip";
import { HowItWorks } from "./how-it-works";
import { PartnerBand } from "./partner-band";
import { formatCards, sectionVisibility, templateCards } from "./view-models";

/**
 * Everything under the hero. `country` is set on `/<country>` and absent on `/`.
 * A failed API call hides its section; the rest of the page still renders.
 */
export async function HomeSections({ country }: { country?: CountryCode }) {
  const [templates, catalog, countryInfo] = country
    ? await Promise.all([fetchTemplates(country), fetchCatalog(country), fetchCountry(country)])
    : [null, null, null];

  const templateModels = country && templates ? templateCards(templates, country) : null;
  const formatModels = country && catalog ? formatCards(catalog, country) : null;
  const show = sectionVisibility({ country, templates: templateModels, formats: formatModels });

  return (
    <div className="space-y-12">
      {show.chooseCountry ? <ChooseCountry /> : null}
      {show.templates && templateModels ? (
        <FeaturedTemplates cards={templateModels} countryName={countryInfo?.name} />
      ) : null}
      {show.formats && formatModels ? <FormatStrip cards={formatModels} /> : null}
      <HowItWorks />
      <PartnerBand />
    </div>
  );
}
