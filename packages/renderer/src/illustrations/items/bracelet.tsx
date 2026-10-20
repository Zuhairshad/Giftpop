import { itemPalette } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

/** Stub: replaced by the real bracelet art. */
export function BraceletIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  return (
    <ItemFrame shape="bracelet" fit={[1, 0, 0]}>
      <path
        d="M56 100a44 44 0 1 0 88 0a44 44 0 1 0 -88 0Z"
        fill={p.fill}
        stroke={p.dark}
        strokeWidth="3"
      />
    </ItemFrame>
  );
}
