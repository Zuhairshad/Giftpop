import type { CountryCode } from "@giftpop/contracts";

import { firstMissingQuestion } from "./question-guard";
import type { QuestionGuardInput } from "./question-guard";
import { builderHref } from "./steps";

/**
 * Where a visitor on checkout must go instead, or null when their gift can be ordered. Checkout
 * needs what the review question needs; the builder itself reopens on the question still missing.
 */
export function checkoutRedirect(country: CountryCode, input: QuestionGuardInput): string | null {
  return firstMissingQuestion("review", input) === null ? null : builderHref(country);
}
