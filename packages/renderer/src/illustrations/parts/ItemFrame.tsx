import type { ReactNode } from "react";

/**
 * Wraps one item's art. `fit` is `[scale, dx, dy]` about the box centre, tuned per shape so the
 * drawing fills the 200 x 200 box and its visual centre sits on (100, 100), the anchor. The
 * `data-placeholder` attribute names the shape (scenes and tests count art with it).
 */
export function ItemFrame({
  shape,
  fit,
  children,
}: {
  shape: string;
  fit: readonly [number, number, number];
  children: ReactNode;
}) {
  const [scale, dx, dy] = fit;
  return (
    <g
      data-placeholder={shape}
      transform={`translate(${100 + dx} ${100 + dy}) scale(${scale}) translate(-100 -100)`}
    >
      {children}
    </g>
  );
}
