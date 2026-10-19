import type { BuilderApi } from "../state";

import { continueState } from "./items/items-copy";

/**
 * The rule behind each question's continue button, as pure functions of what the builder holds.
 * Each body's `use<Name>CanContinue` hook is `useBuilder()` passed through one of these.
 */

/** A packaging is chosen. */
export function packagingReady(builder: Pick<BuilderApi, "packaging">): boolean {
  return builder.packaging !== null;
}

/** Both colours are set. The store defaults each one to the packaging's first colour. */
export function coloursReady(builder: Pick<BuilderApi, "wrapperColor" | "ribbonColor">): boolean {
  return builder.wrapperColor !== null && builder.ribbonColor !== null;
}

/**
 * The item count is within the packaging's min and max and the gift fits, so no design problem
 * remains except `TEXT_TOO_LONG` (text limits belong to the personalise question).
 */
export function itemsReady(builder: Pick<BuilderApi, "packaging" | "problems">): boolean {
  return builder.packaging !== null && continueState(builder.problems).enabled;
}

/** The layout needs no decision: the arrangement is always valid. */
export function layoutReady(): boolean {
  return true;
}

/** Card message, recipient and item names are all within their limits. */
export function personaliseReady(builder: Pick<BuilderApi, "packaging" | "problems">): boolean {
  return (
    builder.packaging !== null &&
    !builder.problems.some((problem) => problem.code === "TEXT_TOO_LONG")
  );
}

/** The design can be ordered: it exists and has no problems at all. */
export function reviewReady(builder: Pick<BuilderApi, "design" | "problems">): boolean {
  return builder.design !== null && builder.problems.length === 0;
}
