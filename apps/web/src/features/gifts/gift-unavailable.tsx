"use client";

import type { ReactElement } from "react";

import { useGiftUnavailable } from "./gifts-freshness";

/** Dims the picture and says so when the gift can no longer be made. Nothing otherwise. */
export function GiftUnavailableOverlay({ id }: { id: string }): ReactElement | null {
  if (!useGiftUnavailable(id)) return null;
  return (
    <div
      aria-hidden="true"
      className="bg-surface/75 absolute inset-0 grid place-items-center p-4 text-center"
    >
      <span className="bg-ink text-canvas rounded-full px-4 py-1.5 text-sm font-bold">
        Not available right now
      </span>
    </div>
  );
}
