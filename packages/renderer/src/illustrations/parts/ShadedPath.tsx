import { mix } from "../../placeholders/color";
import { ROUND } from "../palette";

import { useArtId } from "./ids";

/**
 * A filled, outlined path lit from the upper left. The body is a diagonal gradient (a lit
 * tint, the fill, then `deep`), and a form-shadow crescent sits on the lower right: the same
 * path in `shadow`, with the lit body slid up and left over it, both clipped to the outline.
 */
export function ShadedPath({
  d,
  fill,
  deep,
  stroke,
  shadow = deep,
  lit,
  strokeWidth = 3,
  shift = 6,
}: {
  d: string;
  fill: string;
  deep: string;
  stroke: string;
  /** The crescent colour; defaults to `deep`. */
  shadow?: string;
  /** The colour at the lit (upper-left) corner; defaults to the fill lifted toward white. */
  lit?: string;
  strokeWidth?: number;
  shift?: number;
}) {
  const clipId = useArtId("clip", `${d}${fill}`);
  const gradId = useArtId("grad", `${d}${fill}${deep}`);
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={lit ?? mix(fill, "#ffffff", 0.32)} />
          <stop offset="0.5" stopColor={fill} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill={shadow} />
        <path d={d} fill={`url(#${gradId})`} transform={`translate(${-shift} ${-shift * 0.8})`} />
      </g>
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} {...ROUND} />
    </g>
  );
}
