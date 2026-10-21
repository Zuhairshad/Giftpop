import type { CountryCode } from "@giftpop/contracts";

/**
 * Remembers that this tab's gift began as a ready-made gift, so the review step can say "Order this
 * gift". The builder drops `?from=` from the address once it has loaded the design, and its state
 * does not keep where the design came from, so the "Start from this" link leaves a note here before
 * it navigates. Per tab and per country; choosing a packaging by hand clears it. Display only: it
 * never changes the design, the quote or what is sent to the API.
 */
const KEY_PREFIX = "giftpop:ready-made-start:";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function key(country: CountryCode): string {
  return `${KEY_PREFIX}${country}`;
}

function browserStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Blocked storage (private window, site data off): the label simply stays the default.
    return null;
  }
}

export function markReadyMadeStart(
  country: CountryCode,
  store: Store | null = browserStore(),
): void {
  try {
    store?.setItem(key(country), "1");
  } catch {
    // Nothing to do: the primary button keeps its default name.
  }
}

export function clearReadyMadeStart(
  country: CountryCode,
  store: Store | null = browserStore(),
): void {
  try {
    store?.removeItem(key(country));
  } catch {
    // Nothing to remember, nothing to clear.
  }
}

export function startedFromReadyMade(
  country: CountryCode,
  store: Store | null = browserStore(),
): boolean {
  try {
    return store?.getItem(key(country)) === "1";
  } catch {
    return false;
  }
}

/** The review step's primary action while the gift can be ordered. */
export function reviewActionLabel(fromReadyMade: boolean): string {
  return fromReadyMade ? "Order this gift" : "Continue to checkout";
}
