"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

const DISMISS_KEY = "gp-partner-banner-dismissed";
const DISMISS_EVENT = "gp-partner-banner-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DISMISS_EVENT, onChange);
  };
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** In flow above the header, so it pushes the page down and scrolls away with it. */
export function PartnerBanner() {
  const saved = useSyncExternalStore(subscribe, readDismissed, () => false);
  const [closed, setClosed] = useState(false);

  if (saved || closed) return null;

  function dismiss() {
    setClosed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
      window.dispatchEvent(new Event(DISMISS_EVENT));
    } catch {
      // Storage blocked: the banner stays closed for this page view only.
    }
  }

  return (
    <div className="bg-primary text-on-primary text-sm">
      <div className="gp-bar flex min-h-11 items-center justify-between gap-3 py-2">
        <p className="min-w-0 flex-1 text-center font-medium wrap-anywhere">
          Looking for partners from every country.{" "}
          <Link href="/partners" className="font-semibold underline underline-offset-2">
            Become a partner
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close this message"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-lg leading-none hover:bg-white/15"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  );
}
