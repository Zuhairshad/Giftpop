"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { ChooseCountryLink } from "./choose-country-link";
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

/**
 * A polite, dismissible "Shipping to X?" suggestion. Choosing sets the cookie; nothing happens before.
 * It floats over the page under the header (absolute, out of flow) so it appears after hydration
 * without pushing any content down.
 */
export function CountrySuggestion({ code, name }: { code: string; name: string }) {
  // The server snapshot is "dismissed" so the banner appears after hydration, never mismatching.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const pathname = usePathname();
  if (dismissed || suggestionHiddenOn(pathname)) return null;

  return (
    <section
      aria-label="Country suggestion"
      className="bg-warm shadow-hairline absolute inset-x-0 top-full"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
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
            onClick={dismiss}
            className={buttonClass({ variant: "ghost", size: "sm", className: "text-muted" })}
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
