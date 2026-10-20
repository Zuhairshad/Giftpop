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
      {/* One line at every width: the question truncates before the actions ever wrap. */}
      <div className="gp-bar flex min-h-[52px] items-center gap-2 py-1 sm:gap-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={`Shipping to ${name}?`}>
          <span aria-hidden="true">{flagEmoji(code)} </span>
          Shipping to {name}?
        </p>
        <div className="flex flex-none items-center gap-1">
          <ChooseCountryLink
            code={code}
            onChosen={dismiss}
            aria-label={`Switch to ${name}`}
            className={buttonClass({ variant: "tint", size: "sm" })}
          >
            Switch
          </ChooseCountryLink>
          <Link
            href="/countries"
            onClick={dismiss}
            className={buttonClass({
              variant: "ghost",
              size: "sm",
              className: "hidden sm:inline-flex",
            })}
          >
            Choose another
          </Link>
          <button
            type="button"
            onClick={dismissAndMoveFocus}
            aria-label="Not now"
            title="Not now"
            className={buttonClass({
              variant: "ghost",
              size: "sm",
              className: "text-ink-2 -mr-2 size-11 px-0",
            })}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M4 4l8 8M12 4l-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
