"use client";

import { GiftScene, isKnownLayoutType } from "@giftpop/renderer";

import type { SceneInput } from "./view-model";

/** The gift as ordered, drawn from the order's snapshots. A placeholder when the layout type is unknown. */
export function ScenePanel({ scene }: { scene: SceneInput }) {
  const known = isKnownLayoutType(scene.packaging.layoutType);
  return (
    <div className="bg-muted/40 mx-auto w-full max-w-md overflow-hidden rounded-lg border">
      {known ? (
        <GiftScene design={scene.design} packaging={scene.packaging} items={scene.items} />
      ) : (
        <p className="text-muted-foreground p-6 text-center text-sm wrap-anywhere">
          This gift uses a layout called &ldquo;{scene.packaging.layoutType}&rdquo; that this app
          does not know, so it cannot be drawn. The item list below is still correct.
        </p>
      )}
    </div>
  );
}
