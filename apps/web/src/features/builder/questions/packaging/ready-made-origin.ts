import { DesignSchema, ShareIdSchema } from "@giftpop/contracts";
import type { CountryCode } from "@giftpop/contracts";
import { z } from "zod";

/**
 * Remembers which ready-made gift this tab's design began as, so the review step can name it, say
 * "Order this gift" and tell the customer whether they changed it. The builder drops `?from=` from
 * the address once it has loaded the design and its state keeps no origin, so `FromLoader` leaves
 * the gift's name and its design here. Per tab and per country; choosing a packaging by hand
 * clears it. Display only: it never changes the design, the quote or what is sent to the API.
 */
const KEY_PREFIX = "giftpop:ready-made-start:";

const ReadyMadeOriginSchema = z.object({
  shareId: ShareIdSchema,
  title: z.string(),
  design: DesignSchema,
});
export type ReadyMadeOrigin = z.infer<typeof ReadyMadeOriginSchema>;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function key(country: CountryCode): string {
  return `${KEY_PREFIX}${country}`;
}

function browserStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Blocked storage (private window, site data off): the review step simply says nothing.
    return null;
  }
}

export function rememberReadyMade(
  country: CountryCode,
  origin: ReadyMadeOrigin,
  store: Store | null = browserStore(),
): void {
  try {
    store?.setItem(key(country), JSON.stringify(origin));
  } catch {
    // Nothing to do: the review step keeps its default wording.
  }
}

export function clearReadyMadeStart(
  country: CountryCode,
  store: Store | null = browserStore(),
): void {
  try {
    store?.removeItem(key(country));
  } catch {
    // Nothing remembered, nothing to clear.
  }
}

/** The stored text as it is, for `useSyncExternalStore` (a snapshot must be a stable value). */
export function readyMadeOriginText(
  country: CountryCode,
  store: Store | null = browserStore(),
): string | null {
  try {
    return store?.getItem(key(country)) ?? null;
  } catch {
    return null;
  }
}

/** Stored text to an origin; anything that is not a valid origin (old format, edited by hand) is null. */
export function parseReadyMadeOrigin(text: string | null): ReadyMadeOrigin | null {
  if (text === null) return null;
  try {
    const result = ReadyMadeOriginSchema.safeParse(JSON.parse(text));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function readyMadeOrigin(
  country: CountryCode,
  store: Store | null = browserStore(),
): ReadyMadeOrigin | null {
  return parseReadyMadeOrigin(readyMadeOriginText(country, store));
}

/** The review step's primary action while the gift can be ordered. */
export function reviewActionLabel(fromReadyMade: boolean): string {
  return fromReadyMade ? "Order this gift" : "Continue to checkout";
}
