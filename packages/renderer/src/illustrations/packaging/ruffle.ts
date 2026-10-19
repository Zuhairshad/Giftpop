export interface RuffleEdge {
  /** SVG path commands (no leading move) that run from the first point to the last. */
  d: string;
  /** The points the scallops pass through, first and last included. */
  points: ReadonlyArray<readonly [number, number]>;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * A crinkled paper edge: `bumps` scallops from x0 to x1 along `yAt(t)` (t runs 0 to 1), each
 * bulging up by `amp`. Pure, so a given wrapper always draws the same pleats.
 */
export function ruffleEdge(
  x0: number,
  x1: number,
  yAt: (t: number) => number,
  bumps: number,
  amp: number,
): RuffleEdge {
  const points: Array<readonly [number, number]> = [];
  for (let i = 0; i <= bumps; i += 1) {
    const t = i / bumps;
    points.push([round1(x0 + (x1 - x0) * t), round1(yAt(t))]);
  }
  let d = "";
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const next = points[i];
    if (!prev || !next) continue;
    const cx = round1((prev[0] + next[0]) / 2);
    const cy = round1((prev[1] + next[1]) / 2 - amp);
    d += `Q${cx} ${cy} ${next[0]} ${next[1]}`;
  }
  return { d, points };
}
