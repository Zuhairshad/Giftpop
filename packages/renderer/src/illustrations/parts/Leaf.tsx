import { GREEN, GREEN_DARK, ROUND } from "../palette";

/** A green leaf with its midrib. Never tinted. */
export function Leaf({ d, vein }: { d: string; vein: string }) {
  return (
    <g>
      <path d={d} fill={GREEN} stroke={GREEN_DARK} strokeWidth="2.5" {...ROUND} />
      <path d={vein} fill="none" stroke={GREEN_DARK} strokeWidth="1.8" opacity="0.6" {...ROUND} />
    </g>
  );
}
