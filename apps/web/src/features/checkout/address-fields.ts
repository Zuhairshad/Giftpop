import type { AddressFormat } from "@giftpop/contracts";

import type { AddressFieldName } from "./fields";

export interface AddressFieldModel {
  name: AddressFieldName;
  label: string;
  required: boolean;
  autoComplete: string;
  maxLength: number;
}

/**
 * The address form for a country, generated from its `addressFormat`: labels and
 * required flags come from data. Line 1 and city are always required; line 2 never is.
 */
export function buildAddressFields(format: AddressFormat): AddressFieldModel[] {
  return [
    {
      name: "line1",
      label: "Address line 1",
      required: true,
      autoComplete: "address-line1",
      maxLength: 120,
    },
    {
      name: "line2",
      label: "Address line 2",
      required: false,
      autoComplete: "address-line2",
      maxLength: 120,
    },
    { name: "city", label: "City", required: true, autoComplete: "address-level2", maxLength: 80 },
    {
      name: "region",
      label: format.region.label,
      required: format.region.required,
      autoComplete: "address-level1",
      maxLength: 80,
    },
    {
      name: "postalCode",
      label: format.postalCode.label,
      required: format.postalCode.required,
      autoComplete: "postal-code",
      maxLength: 20,
    },
  ];
}
