import { ROUND } from "../palette";

/**
 * Light on clear glass, lit from the upper left: a long soft reflection down the left wall, a
 * thin bright line beside it and a short rim glint on the right. Coordinates are the wall's
 * left and right x and its top and bottom y.
 */
export function GlassGlints({
  left,
  right,
  top,
  bottom,
}: {
  left: number;
  right: number;
  top: number;
  bottom: number;
}) {
  const span = bottom - top;
  return (
    <g fill="none" stroke="#ffffff" {...ROUND}>
      <path d={`M${left + 8} ${top + 6}V${bottom - 8}`} strokeWidth="7" opacity="0.45" />
      <path d={`M${left + 15} ${top + 10}V${top + span * 0.55}`} strokeWidth="2" opacity="0.7" />
      <path
        d={`M${right - 7} ${top + span * 0.2}V${top + span * 0.5}`}
        strokeWidth="3"
        opacity="0.4"
      />
    </g>
  );
}

/** The thick glass base: a pale band with a bright line, the contact edge of a glass object. */
export function GlassBase({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g {...ROUND}>
      <path d={`M${x + 4} ${y}H${x + width - 4}`} stroke="#ffffff" strokeWidth="3" opacity="0.55" />
      <path
        d={`M${x + 8} ${y + 5}H${x + width - 8}`}
        stroke="#000000"
        strokeWidth="2"
        opacity="0.08"
      />
    </g>
  );
}
