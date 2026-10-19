import type { CountryCode } from "@giftpop/contracts";

import type { BuilderStep } from "./types";

/** URL of a builder step, for example `/pk/build/items`. */
export function stepHref(country: CountryCode, step: BuilderStep): string {
  return `/${country.toLowerCase()}/build/${step}`;
}
