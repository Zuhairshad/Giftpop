import type { Item, ItemShape } from "@giftpop/contracts";
import Image from "next/image";
import type { ReactElement, ReactNode } from "react";

const EDGE = "rgb(58 34 48 / 0.35)";
const SHINE = "rgb(255 255 255 / 0.45)";

/**
 * Silhouettes for items with no image yet, one per shape, in the item's own colour.
 * Drawn in a 100 x 100 box. The renderer has its own placeholders for the gift scene.
 */
const SILHOUETTES: Record<ItemShape, (color: string) => ReactNode> = {
  bar: (c) => (
    <>
      <rect x="28" y="10" width="44" height="80" rx="6" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <path d="M28 36H72M28 63H72M50 10V90" stroke={EDGE} strokeWidth="1.5" />
    </>
  ),
  bottle: (c) => (
    <>
      <rect x="40" y="6" width="20" height="20" rx="3" fill={EDGE} />
      <rect x="28" y="24" width="44" height="68" rx="14" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <rect x="36" y="44" width="28" height="24" rx="4" fill={SHINE} />
    </>
  ),
  jar: (c) => (
    <>
      <rect x="24" y="10" width="52" height="16" rx="5" fill={EDGE} />
      <rect x="20" y="24" width="60" height="68" rx="16" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <rect x="30" y="44" width="40" height="24" rx="5" fill={SHINE} />
    </>
  ),
  box: (c) => (
    <>
      <rect x="12" y="28" width="76" height="60" rx="7" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <rect x="46" y="28" width="8" height="60" fill={SHINE} />
      <path
        d="M50 28C38 10 22 18 30 26C34 30 46 30 50 28ZM50 28C62 10 78 18 70 26C66 30 54 30 50 28Z"
        fill={c}
        stroke={EDGE}
        strokeWidth="2"
      />
    </>
  ),
  mug: (c) => (
    <>
      <path d="M66 38H76A10 10 0 0 1 76 66H66" fill="none" stroke={EDGE} strokeWidth="6" />
      <rect x="18" y="24" width="52" height="64" rx="9" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <rect x="26" y="34" width="10" height="38" rx="5" fill={SHINE} />
    </>
  ),
  flower: (c) => (
    <>
      <path d="M50 56V94" stroke="#4f9c7f" strokeWidth="5" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="26"
          rx="11"
          ry="17"
          fill={c}
          stroke={EDGE}
          strokeWidth="2"
          transform={`rotate(${angle} 50 42)`}
        />
      ))}
      <circle cx="50" cy="42" r="9" fill="#ffe08a" stroke={EDGE} strokeWidth="2" />
    </>
  ),
  card: (c) => (
    <>
      <rect x="20" y="12" width="60" height="76" rx="5" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <path
        d="M50 62C34 50 38 38 46 40C49 41 50 44 50 44C50 44 51 41 54 40C62 38 66 50 50 62Z"
        fill="#e8336d"
      />
    </>
  ),
  "soft-toy": (c) => (
    <>
      <circle cx="30" cy="22" r="10" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <circle cx="70" cy="22" r="10" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <ellipse cx="50" cy="70" rx="26" ry="22" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <circle cx="50" cy="38" r="22" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <circle cx="42" cy="36" r="3" fill={EDGE} />
      <circle cx="58" cy="36" r="3" fill={EDGE} />
      <ellipse cx="50" cy="46" rx="6" ry="4" fill={SHINE} />
    </>
  ),
  balloon: (c) => (
    <>
      <path d="M50 74C46 84 54 88 50 96" fill="none" stroke={EDGE} strokeWidth="2" />
      <ellipse cx="50" cy="42" rx="28" ry="34" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <ellipse cx="40" cy="30" rx="6" ry="10" fill={SHINE} />
    </>
  ),
  other: (c) => (
    <>
      <circle cx="50" cy="50" r="36" fill={c} stroke={EDGE} strokeWidth="2.5" />
      <circle cx="38" cy="38" r="9" fill={SHINE} />
    </>
  ),
};

/** Picture for an item card: the uploaded image, or the silhouette for its shape and colour. */
export function ItemArt({ item }: { item: Item }): ReactElement {
  if (item.image) {
    // Resized by the Next image optimiser (host from PUBLIC_ASSET_BASE_URL), so a 112 px card
    // no longer downloads the full upload. Lazy by default.
    return (
      <Image
        src={item.image.url}
        alt=""
        width={item.image.width}
        height={item.image.height}
        sizes="112px"
        className="size-full object-contain"
      />
    );
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="size-full">
      {SILHOUETTES[item.shape](item.color)}
    </svg>
  );
}
