"use client";

import type { SharedDesignView } from "@giftpop/contracts";
import { GiftScene, isKnownLayoutType } from "@giftpop/renderer";

/** A saved design drawn the way customers see it, or a plain note when its layout is unknown. */
export function SharedDesignScene({ view }: { view: SharedDesignView }) {
  return (
    <div className="bg-muted/40 overflow-hidden rounded-lg border">
      {isKnownLayoutType(view.packaging.layoutType) ? (
        <GiftScene design={view.design} packaging={view.packaging} items={view.items} />
      ) : (
        <p className="text-muted-foreground p-6 text-center text-sm">
          There is no layout called &ldquo;{view.packaging.layoutType}&rdquo;, so there is nothing
          to preview.
        </p>
      )}
    </div>
  );
}
