import { useId } from "react";

import { ROUND } from "../palette";

function hashOf(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * A filled, outlined path with a soft form shadow on its lower right. The shadow is the same
 * path in a darker fill, with the plain fill slid up and left over it, both clipped to the
 * outline. `useId` keeps the clip id unique when many copies share a page.
 */
export function ShadedPath({
  d,
  fill,
  deep,
  stroke,
  strokeWidth = 3,
  shift = 6,
}: {
  d: string;
  fill: string;
  deep: string;
  stroke: string;
  strokeWidth?: number;
  shift?: number;
}) {
  // The id also carries a hash of the path, so two separate React roots on one page (each
  // restarting `useId` at the same value) can only ever share an id when the outlines match.
  const clipId = `clip-${useId().replace(/:/g, "")}-${hashOf(d)}`;
  return (
    <g>
      <clipPath id={clipId}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill={deep} />
        <path d={d} fill={fill} transform={`translate(${-shift} ${-shift * 0.8})`} />
      </g>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} {...ROUND} />
    </g>
  );
}
