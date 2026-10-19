import { ShareIdSchema } from "@giftpop/contracts";
import type { ShareId, SharedDesignView } from "@giftpop/contracts";

import { ApiError } from "@/lib/api-errors";

export type FromParam =
  | { kind: "none" }
  /** `?from=` is there but is not a share id. */
  | { kind: "invalid" }
  | { kind: "share"; shareId: ShareId };

/** Reads the `from` search param of the review URL (`null` when the param is absent). */
export function readFromParam(raw: string | null): FromParam {
  if (raw === null) return { kind: "none" };
  const parsed = ShareIdSchema.safeParse(raw);
  return parsed.success ? { kind: "share", shareId: parsed.data } : { kind: "invalid" };
}

/** Names of the items in the shared design that are no longer sold, in slot order. */
export function unavailableItemNames(
  view: Pick<SharedDesignView, "design" | "items" | "unavailableItemIds">,
): string[] {
  const unavailable = new Set(view.unavailableItemIds);
  const names = new Map(view.items.map((item) => [item.id, item.name]));
  return [...view.design.items]
    .sort((a, b) => a.slot - b.slot)
    .filter((line) => unavailable.has(line.itemId))
    .map((line) => names.get(line.itemId) ?? "An item");
}

/** The notice shown after loading a shared design, or null when nothing was left out. */
export function unavailableNotice(names: readonly string[]): string | null {
  if (names.length === 0) return null;
  return `Left out because they are no longer available: ${names.join(", ")}.`;
}

/** Plain words for a failed load of `?from=`. */
export function describeFromError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "We could not find that gift. The link may be wrong, or the gift may have been removed.";
  }
  return "We could not load that gift. Check your connection and try again.";
}

export const INVALID_FROM_MESSAGE = "That gift link is not valid.";
