"use client";

import type { Country, PartnerRequestStatus } from "@giftpop/contracts";

import { STATUS_OPTIONS } from "../lib/format";
import type { PartnerFilters } from "../lib/partner-query";

import { Field } from "@/features/catalog/components/field";
import { OptionSelect } from "@/features/catalog/components/option-select";

const ALL = "all";

interface PartnersFiltersProps {
  filters: PartnerFilters;
  countries: readonly Country[];
  onChange: (next: PartnerFilters) => void;
}

/** Status and country filters. Changing one goes back to page 1. */
export function PartnersFilters({ filters, countries, onChange }: PartnersFiltersProps) {
  const statusOptions = [{ value: ALL, label: "Any status" }, ...STATUS_OPTIONS];
  const countryOptions = [
    { value: ALL, label: "Any country" },
    ...countries.map((country) => ({ value: country.code, label: country.name })),
    // A country in the URL that is not in the list yet still shows as selected.
    ...(filters.country && !countries.some((country) => country.code === filters.country)
      ? [{ value: filters.country, label: filters.country }]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-end gap-3" role="search">
      <Field label="Status" className="w-full sm:w-48">
        {(field) => (
          <OptionSelect
            id={field.id}
            value={filters.status ?? ALL}
            options={statusOptions}
            onValueChange={(value) =>
              onChange({
                ...filters,
                status: value === ALL ? undefined : (value as PartnerRequestStatus),
                page: 1,
              })
            }
          />
        )}
      </Field>
      <Field label="Country" className="w-full sm:w-56">
        {(field) => (
          <OptionSelect
            id={field.id}
            value={filters.country ?? ALL}
            options={countryOptions}
            onValueChange={(value) =>
              onChange({ ...filters, country: value === ALL ? undefined : value, page: 1 })
            }
          />
        )}
      </Field>
    </div>
  );
}
