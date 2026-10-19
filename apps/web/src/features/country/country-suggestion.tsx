"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { ChooseCountryLink } from "./choose-country-link";
import { flagEmoji } from "./flag";

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

const BUTTON = "rounded-full px-4 py-1.5 text-sm font-bold transition-colors";

/** A polite, dismissible "Shipping to X?" suggestion. Choosing sets the cookie; nothing happens before. */
export function CountrySuggestion({ code, name }: { code: string; name: string }) {
  // The server snapshot is "dismissed" so the banner appears after hydration, never mismatching.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  if (dismissed) return null;

  return (
    <section aria-label="Country suggestion" className="bg-pink-soft text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <p className="min-w-0 text-sm font-semibold wrap-anywhere">
          <span aria-hidden="true">{flagEmoji(code)} </span>
          Shipping to {name}?
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ChooseCountryLink
            code={code}
            onChosen={dismiss}
            className={`${BUTTON} bg-pink text-on-pink hover:opacity-90`}
          >
            Yes, use {name}
          </ChooseCountryLink>
          <Link
            href="/countries"
            onClick={dismiss}
            className={`${BUTTON} border-border bg-surface text-foreground hover:bg-surface-soft border`}
          >
            Choose another
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className={`${BUTTON} text-muted hover:text-foreground`}
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
