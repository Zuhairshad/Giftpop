import type { AddressFormat } from "./country";
import type { Address } from "./order";

export interface AddressProblem {
  field: "region" | "postalCode";
  message: string;
}

/**
 * Checks an address against the country's `addressFormat`: which of `region` and
 * `postalCode` are required comes from data, never from a country code. Pure; the
 * checkout form and the API both use it.
 */
export function validateAddress(address: Address, format: AddressFormat): AddressProblem[] {
  const problems: AddressProblem[] = [];
  for (const field of ["region", "postalCode"] as const) {
    const rule = format[field];
    if (rule.required && !(address[field] ?? "").trim()) {
      problems.push({ field, message: `${rule.label} is required` });
    }
  }
  return problems;
}
