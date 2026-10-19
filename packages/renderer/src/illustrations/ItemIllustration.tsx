import type { ItemShape } from "@giftpop/contracts";

import { ITEM_ILLUSTRATIONS } from "./registry";
import { ITEM_ART_SIZE } from "./types";

/**
 * A standalone item illustration as its own `<svg>`, for tiles, the hero and anywhere outside
 * a gift scene. Scenes draw the registry entry directly.
 */
export function ItemIllustrationSvg({
  shape,
  color,
  size,
  className,
}: {
  shape: ItemShape;
  color: string;
  size?: number;
  className?: string;
}) {
  const Art = ITEM_ILLUSTRATIONS[shape];
  return (
    <svg
      viewBox={`0 0 ${ITEM_ART_SIZE} ${ITEM_ART_SIZE}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <Art color={color} />
    </svg>
  );
}
