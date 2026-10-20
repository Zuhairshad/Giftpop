import type { BuilderApi } from "../state";

import {
  coloursReady,
  itemsReady,
  layoutReady,
  packagingReady,
  personaliseGap,
  personaliseReady,
  reviewReady,
} from "./can-continue";
import { continueState } from "./items/items-copy";

/**
 * Whether a question's primary action is on and, when it is not, the one line the footer shows
 * beside it (linked with `aria-describedby`), so a disabled button never looks broken.
 */
export interface ContinueCheck {
  ready: boolean;
  /** Null when ready. */
  reason: string | null;
}

export const PICK_PACKAGING_FIRST = "Pick a packaging first";
export const PICK_COLOURS_FIRST = "Pick a wrapper and ribbon colour first";
export const FIX_PROBLEMS_FIRST = "Fix the problems listed above first";

const READY: ContinueCheck = { ready: true, reason: null };

function blocked(reason: string): ContinueCheck {
  return { ready: false, reason };
}

type Builder = Pick<
  BuilderApi,
  | "packaging"
  | "wrapperColor"
  | "ribbonColor"
  | "problems"
  | "design"
  | "recipientName"
  | "cardMessage"
  | "itemNames"
  | "lines"
  | "catalog"
>;

export function packagingCheck(builder: Pick<Builder, "packaging">): ContinueCheck {
  return packagingReady(builder) ? READY : blocked(PICK_PACKAGING_FIRST);
}

export function coloursCheck(
  builder: Pick<Builder, "packaging" | "wrapperColor" | "ribbonColor">,
): ContinueCheck {
  if (builder.packaging === null) return blocked(PICK_PACKAGING_FIRST);
  return coloursReady(builder) ? READY : blocked(PICK_COLOURS_FIRST);
}

/** The first count or space problem, as the design rules word it ("Pick at least 6 items (you have 2)."). */
export function itemsCheck(builder: Pick<Builder, "packaging" | "problems">): ContinueCheck {
  if (builder.packaging === null) return blocked(PICK_PACKAGING_FIRST);
  if (itemsReady(builder)) return READY;
  return blocked(continueState(builder.problems).message ?? FIX_PROBLEMS_FIRST);
}

export function layoutCheck(): ContinueCheck {
  return layoutReady() ? READY : blocked(FIX_PROBLEMS_FIRST);
}

export const ENTER_RECIPIENT = "Enter who the gift is for";
export const WRITE_CARD_MESSAGE = "Write a card message";
export const NAME_THE_ITEMS = "Add a name for each personalised item";

const GAP_REASONS = {
  recipient: ENTER_RECIPIENT,
  message: WRITE_CARD_MESSAGE,
  "item-name": NAME_THE_ITEMS,
} as const;

/** The first missing answer, then the first text that is too long. */
export function personaliseCheck(
  builder: Pick<
    Builder,
    "packaging" | "problems" | "recipientName" | "cardMessage" | "itemNames" | "lines" | "catalog"
  >,
): ContinueCheck {
  if (builder.packaging === null) return blocked(PICK_PACKAGING_FIRST);
  const gap = personaliseGap(builder);
  if (gap !== null) return blocked(GAP_REASONS[gap]);
  if (personaliseReady(builder)) return READY;
  const tooLong = builder.problems.find((problem) => problem.code === "TEXT_TOO_LONG");
  return blocked(tooLong?.message ?? FIX_PROBLEMS_FIRST);
}

/** The body lists every problem, so the footer points at that list. */
export function reviewCheck(builder: Pick<Builder, "design" | "problems">): ContinueCheck {
  if (builder.design === null) return blocked(PICK_PACKAGING_FIRST);
  return reviewReady(builder) ? READY : blocked(FIX_PROBLEMS_FIRST);
}
