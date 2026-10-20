import { GOLD, GOLD_DARK, GOLD_LIGHT, itemPalette, ROUND } from "../palette";
import { ItemFrame } from "../parts/ItemFrame";
import type { ItemIllustrationProps } from "../types";

const CX = 100;
const CY = 102;
const RX = 68;
const RY = 46;
const TILT = -24;
const TILT_RAD = (TILT * Math.PI) / 180;

const deg = (d: number) => (d * Math.PI) / 180;
const TILT_TRANSFORM = `rotate(${TILT} ${CX} ${CY})`;
const BACK_ANGLES = [215, 325];
const FRONT_ANGLES = [40, 90, 140];
const CLASP_ANGLE = 262;
const BACK_CHARM_SIZE = 0.72;
const FRONT_CHARM_SIZE = 1.0;
const CENTRE_CHARM_SIZE = 1.2;
const CLASP_SCALE = 1.35;
const LOBE_ROTATIONS = [0, 90, 180, 270];

/** A point on the tilted chain loop at angle `t` (radians; positive sin is the near side). */
function onLoop(angle: number): { x: number; y: number } {
  const t = deg(angle);
  const x = RX * Math.cos(t);
  const y = RY * Math.sin(t);
  return {
    x: CX + x * Math.cos(TILT_RAD) - y * Math.sin(TILT_RAD),
    y: CY + x * Math.sin(TILT_RAD) + y * Math.cos(TILT_RAD),
  };
}

/** One heart lobe with its tip at the origin, pointing down; rotated four times to make the clover. */
const LOBE =
  "M0 0C-8 -5-10 -14-5 -15.5C-2.5 -16.3 0 -14 0 -12C0 -14 2.5 -16.3 5 -15.5C10 -14 8 -5 0 0Z";

const LOOP = `M${CX - RX} ${CY}a${RX} ${RY} 0 1 0 ${RX * 2} 0a${RX} ${RY} 0 1 0 ${-RX * 2} 0Z`;
const CLASP = "M-8 0C-8 -6 8 -6 8 0C8 6 -6 6 -9 3";

interface CloverColors {
  fill: string;
  dark: string;
  shine: string;
}

function Clover({
  x,
  y,
  size,
  fill,
  dark,
  shine,
}: CloverColors & { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${size})`} data-charm="clover">
      <circle cy="-2" r="2.4" fill="none" stroke={GOLD_DARK} strokeWidth="1.4" />
      <g transform="translate(0 4)">
        {LOBE_ROTATIONS.map((a) => (
          <path
            key={a}
            d={LOBE}
            transform={`rotate(${a})`}
            fill={fill}
            stroke={dark}
            strokeWidth="1.6"
            {...ROUND}
          />
        ))}
        <circle r="2.3" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
        <path
          d="M-9 -9.5Q-6 -12 -3 -10"
          fill="none"
          stroke={shine}
          strokeWidth="1.4"
          opacity="0.85"
          {...ROUND}
        />
      </g>
    </g>
  );
}

/** A tilted gold chain bracelet seen three-quarter, with four-leaf clover charms and a lobster clasp. */
export function BraceletIllustration({ color }: ItemIllustrationProps) {
  const p = itemPalette(color);
  const back = BACK_ANGLES.map(onLoop);
  const front = FRONT_ANGLES.map(onLoop);
  const clasp = onLoop(CLASP_ANGLE);
  const colors = { fill: p.fill, dark: p.dark, shine: p.shine };
  return (
    <ItemFrame shape="bracelet" fit={[1.2, 0, -8]}>
      <g transform={TILT_TRANSFORM}>
        <ellipse
          cx={CX}
          cy={CY + 7}
          rx={RX}
          ry={RY}
          fill="none"
          stroke={GOLD_DARK}
          strokeWidth="2"
          opacity="0.3"
        />
      </g>
      {back.map((b, i) => (
        <Clover key={i} x={b.x} y={b.y} size={BACK_CHARM_SIZE} {...colors} />
      ))}
      <g transform={TILT_TRANSFORM}>
        <path d={LOOP} fill="none" stroke={GOLD_DARK} strokeWidth="10" {...ROUND} />
        <path d={LOOP} fill="none" stroke={GOLD} strokeWidth="7" strokeDasharray="7 3" {...ROUND} />
        <path
          d={LOOP}
          fill="none"
          stroke={GOLD_LIGHT}
          strokeWidth="1.3"
          strokeDasharray="3 8"
          opacity="0.9"
          {...ROUND}
        />
      </g>
      <g
        transform={`translate(${clasp.x.toFixed(2)} ${clasp.y.toFixed(2)}) rotate(${TILT}) scale(${CLASP_SCALE})`}
        data-clasp="lobster"
      >
        <path d={CLASP} fill="none" stroke={GOLD_DARK} strokeWidth="4.6" {...ROUND} />
        <path d={CLASP} fill="none" stroke={GOLD} strokeWidth="2.4" {...ROUND} />
        <circle cx="-9" cy="3" r="1.8" fill={GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="1" />
      </g>
      {front.map((f, i) => (
        <Clover
          key={i}
          x={f.x}
          y={f.y}
          size={i === 1 ? CENTRE_CHARM_SIZE : FRONT_CHARM_SIZE}
          {...colors}
        />
      ))}
    </ItemFrame>
  );
}
