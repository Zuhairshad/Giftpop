import type { Item } from "@giftpop/contracts";
import { ItemIllustrationSvg } from "@giftpop/renderer";
import Image from "next/image";
import type { ReactElement } from "react";

import { canOptimise } from "@/lib/image-url";

/**
 * Picture for an item tile: the uploaded image if the item has one, otherwise the shared
 * illustration for its shape and colour (the same drawing the gift scene uses).
 */
export function ItemArt({ item }: { item: Item }): ReactElement {
  if (item.image) {
    // Resized by the Next image optimiser (host from PUBLIC_ASSET_BASE_URL), so a 112 px tile
    // does not download the full upload. Lazy by default.
    return (
      <Image
        src={item.image.url}
        alt=""
        width={item.image.width}
        height={item.image.height}
        sizes="112px"
        // An image under a host the optimiser does not allow still loads, at full size.
        unoptimized={!canOptimise(item.image.url)}
        className="size-full object-contain"
      />
    );
  }
  return <ItemIllustrationSvg shape={item.shape} color={item.color} className="size-full" />;
}
