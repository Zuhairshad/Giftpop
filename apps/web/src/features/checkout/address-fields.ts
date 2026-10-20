import type { AddressFormat } from "@giftpop/contracts";

import type { AddressFieldName } from "./fields";

import { addressLineText, nameText, postalCodeText } from "@/lib/input-filters";

export interface AddressFieldModel {
  name: AddressFieldName;
  label: string;
  required: boolean;
  autoComplete: string;
  maxLength: number;
  /** Drops characters this field never holds. */
  filter: (value: string) => string;
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
      filter: addressLineText,
    },
    {
      name: "line2",
      label: "Address line 2",
      required: false,
      autoComplete: "address-line2",
      maxLength: 120,
      filter: addressLineText,
    },
    {
      name: "city",
      label: "City",
      required: true,
      autoComplete: "address-level2",
      maxLength: 80,
      filter: nameText,
    },
    {
      name: "region",
      label: format.region.label,
      required: format.region.required,
      autoComplete: "address-level1",
      maxLength: 80,
      filter: nameText,
    },
    {
      name: "postalCode",
      label: format.postalCode.label,
      required: format.postalCode.required,
      autoComplete: "postal-code",
      maxLength: 20,
      filter: postalCodeText,
    },
  ];
}
