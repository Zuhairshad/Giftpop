"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { ChooseCountryLink } from "./choose-country-link";
import { COUNTRY_PILL_ATTR } from "./country-picker";
import { flagEmoji } from "./flag";
import { suggestionHiddenOn } from "./suggestion-visibility";

import { buttonClass } from "@/components/ui";

const DISMISSED_KEY = "gp-country-suggestion-dismissed";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss(): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage blocked: the banner just comes back on the next page load.
  }
  listeners.forEach((listener) => listener());
}

/** "Not now" removes the banner; focus moves on to the header country pill, the next control. */
function dismissAndMoveFocus(): void {
  dismiss();
  document.querySelector<HTMLElement>(`[${COUNTRY_PILL_ATTR}]`)?.focus();
}

/**
 * A polite, dismissible "Shipping to X?" suggestion. Choosing sets the cookie; nothing happens before.
 * It sits in normal flow above the sticky header, so it pushes the page down and scrolls away with it
 * instead of covering headings. It appears after hydration (the dismissal lives in sessionStorage).
 */
export function CountrySuggestion({ code, name }: { code: string; name: string }) {
  // The server snapshot is "dismissed" so the banner appears after hydration, never mismatching.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const pathname = usePathname();
  if (dismissed || suggestionHiddenOn(pathname)) return null;

  return (
    <section
      aria-label="Country suggestion"
      className="gp-suggestion bg-warm shadow-hairline flex-none"
    >
      <div className="gp-shell flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
        <p className="min-w-0 text-sm font-medium wrap-anywhere">
          <span aria-hidden="true">{flagEmoji(code)} </span>
          Shipping to {name}?
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <ChooseCountryLink
            code={code}
            onChosen={dismiss}
            className={buttonClass({ variant: "tint", size: "sm" })}
          >
            Yes, use {name}
          </ChooseCountryLink>
          <Link
            href="/countries"
            onClick={dismiss}
            className={buttonClass({ variant: "ghost", size: "sm" })}
          >
            Choose another
          </Link>
          <button
            type="button"
            onClick={dismissAndMoveFocus}
            className={buttonClass({ variant: "ghost", size: "sm", className: "text-muted" })}
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
