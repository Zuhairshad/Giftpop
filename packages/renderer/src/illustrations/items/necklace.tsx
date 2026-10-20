import { itemPalette } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

/** Stub: replaced by the real necklace art. */
export function NecklaceIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="necklace" fit={[1, 0, 0]}>
      <path
        d="M60 100a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="3"
      />
    </ItemFrame>
  );
}
