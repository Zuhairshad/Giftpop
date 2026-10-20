/**
 * The heart box's geometry in the 1000 x 1000 scene. The opening spans x 200..800 with lobe
 * tops at y 360, a dip at (500, 420) and a point at (500, 650); the layout stands items in it.
 * Everything is built from the right half and mirrored about x = 500, so the heart is symmetric.
 */
export type Pt = readonly [number, number];
type Cubic = readonly [Pt, Pt, Pt, Pt];

export const HEART_CX = 500;
/** Height of the outside wall, rim to base. */
export const WALL_DEPTH = 120;

const DIP: Pt = [500, 420];
const POINT: Pt = [500, 650];
const SIDE: Pt = [800, 470];

const RIGHT_LOWER: Cubic = [SIDE, [800, 540], [620, 600], POINT];

/** Right half, from the dip over the lobe and down to the point. */
const RIGHT: readonly Cubic[] = [
  [DIP, [520, 385], [580, 360], [650, 360]],
  [[650, 360], [740, 360], [800, 410], SIDE],
  RIGHT_LOWER,
];

const mirror = ([x, y]: Pt): Pt => [2 * HEART_CX - x, y];
const reverse = ([a, b, c, d]: Cubic): Cubic => [d, c, b, a];
const mirrorCubic = (c: Cubic): Cubic => [mirror(c[0]), mirror(c[1]), mirror(c[2]), mirror(c[3])];

/** Left half, from the point up to the dip: the mirror of RIGHT, traced backwards. */
const LEFT: readonly Cubic[] = [...RIGHT].reverse().map((c) => reverse(mirrorCubic(c)));
/** The front (lower) rim, left side through the point to the right side. */
const FRONT: readonly Cubic[] = [reverse(mirrorCubic(RIGHT_LOWER)), RIGHT_LOWER].map((c, i) =>
  i === 0 ? c : reverse(c),
);

export interface HeartPlace {
  /** Scale about (500, 520). */
  scale?: number;
  dx?: number;
  dy?: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function place(p: Pt, { scale = 1, dx = 0, dy = 0 }: HeartPlace): string {
  return `${r1(HEART_CX + (p[0] - HEART_CX) * scale + dx)} ${r1(520 + (p[1] - 520) * scale + dy)}`;
}

const curve = (c: Cubic, at: HeartPlace) =>
  `C${place(c[1], at)} ${place(c[2], at)} ${place(c[3], at)}`;

/** The closed heart outline. */
export function heartPath(at: HeartPlace = {}): string {
  return `M${place(DIP, at)}${[...RIGHT, ...LEFT].map((c) => curve(c, at)).join("")}Z`;
}

/** Front rim from the left side through the point to the right side (open path). */
export function frontEdgePath(at: HeartPlace = {}): string {
  const [a, b] = FRONT as readonly [Cubic, Cubic];
  return `M${place(a[0], at)}${curve(a, at)}${curve(b, at)}`;
}

/** The front wall: the front rim extruded down by `depth`. */
export function frontWallPath(depth = WALL_DEPTH): string {
  const [a, b] = FRONT as readonly [Cubic, Cubic];
  const down = { dy: depth };
  return (
    `${frontEdgePath()}L${place(b[3], down)}` +
    `${curve(reverse(b), down)}${curve(reverse(a), down)}Z`
  );
}

function sample(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const k = [u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3] as const;
  return [
    k[0] * c[0][0] + k[1] * c[1][0] + k[2] * c[2][0] + k[3] * c[3][0],
    k[0] * c[0][1] + k[1] * c[1][1] + k[2] * c[2][1] + k[3] * c[3][1],
  ];
}

/** Height of the front rim at `x`, found by sampling the curve. */
export function frontEdgeY(x: number): number {
  let best = Number.POSITIVE_INFINITY;
  let y = POINT[1];
  for (const c of FRONT) {
    for (let i = 0; i <= 200; i += 1) {
      const p = sample(c, i / 200);
      if (Math.abs(p[0] - x) < best) {
        best = Math.abs(p[0] - x);
        y = p[1];
      }
    }
  }
  return y;
}

/** Points sampled along the whole outline, for bounds and symmetry checks. */
export function heartSamples(perCurve = 40): Pt[] {
  const out: Pt[] = [];
  for (const c of [...RIGHT, ...LEFT]) {
    for (let i = 0; i <= perCurve; i += 1) out.push(sample(c, i / perCurve));
  }
  return out;
}
