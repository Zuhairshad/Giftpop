import { GiftScene } from "@giftpop/renderer";

import { canPreviewLayout } from "../lib/scene-preview";
import type { ScenePreview } from "../lib/scene-preview";

/** The renderer's `<GiftScene/>` in a card, or a note when the layout type is not registered. */
export function SceneView({ scene, caption }: { scene: ScenePreview; caption: string }) {
  const known = canPreviewLayout(scene.packaging.layoutType);
  return (
    <figure className="grid grid-cols-1 gap-2">
      <div className="bg-muted/40 mx-auto w-full max-w-sm overflow-hidden rounded-lg border">
        {known ? (
          <GiftScene design={scene.design} packaging={scene.packaging} items={scene.items} />
        ) : (
          <p className="text-muted-foreground p-6 text-center text-sm">
            There is no layout called &ldquo;{scene.packaging.layoutType}&rdquo;, so there is
            nothing to preview.
          </p>
        )}
      </div>
      <figcaption className="text-muted-foreground text-center text-xs">{caption}</figcaption>
    </figure>
  );
}
