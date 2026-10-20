import type { BuilderApi } from "../state";

import { continueState } from "./items/items-copy";
import { nameableItems } from "./personalise/limits";

/**
 * The rule behind each question's continue button, as pure functions of what the builder holds.
 * The `use<Name>CanContinue` hooks in `use-can-continue.ts` pass `useBuilder()` through these.
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

export type PersonaliseGap = "recipient" | "message" | "item-name";

/** The first required answer still missing, in the order the form shows them. */
export function personaliseGap(
  builder: Pick<BuilderApi, "recipientName" | "cardMessage" | "itemNames" | "lines" | "catalog">,
): PersonaliseGap | null {
  if (builder.recipientName.trim() === "") return "recipient";
  if (builder.cardMessage.trim() === "") return "message";
  const nameable = nameableItems(
    builder.lines,
    builder.catalog.items.map((entry) => entry.item),
  );
  const unnamed = nameable.some(({ item }) => (builder.itemNames[item.id] ?? "").trim() === "");
  return unnamed ? "item-name" : null;
}

/** Recipient, card message and every item name are filled in and within their limits. */
export function personaliseReady(
  builder: Pick<
    BuilderApi,
    "packaging" | "problems" | "recipientName" | "cardMessage" | "itemNames" | "lines" | "catalog"
  >,
): boolean {
  return (
    builder.packaging !== null &&
    personaliseGap(builder) === null &&
    !builder.problems.some((problem) => problem.code === "TEXT_TOO_LONG")
  );
}

/** The design can be ordered: it exists and has no problems at all. */
export function reviewReady(builder: Pick<BuilderApi, "design" | "problems">): boolean {
  return builder.design !== null && builder.problems.length === 0;
}
