import type { Design, Item, Packaging } from "@giftpop/contracts";
import { GiftScene, isKnownLayoutType } from "@giftpop/renderer";
import type { ReactElement } from "react";

import { optimisedImageUrl } from "@/lib/image-url";

interface SafeSceneProps {
  design: Design;
  packaging: Packaging;
  items: readonly Item[];
  motion?: boolean;
  className?: string;
}

/**
 * `GiftScene`, but a packaging whose layout type the renderer does not know shows a plain
 * placeholder instead of crashing the whole screen.
 */
export function SafeScene({ packaging, ...rest }: SafeSceneProps): ReactElement {
  if (!isKnownLayoutType(packaging.layoutType)) {
    return (
      <div
        role="img"
        aria-label={`Preview of ${packaging.name} is not available`}
        className="bg-surface-soft text-muted rounded-card grid size-full place-items-center p-4 text-center text-sm"
      >
        Preview not available
      </div>
    );
  }
  return <GiftScene imageUrl={optimisedImageUrl} packaging={packaging} {...rest} />;
}
