/** Small pure easing helpers for the hero timeline. All take and return plain numbers. */

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (u: number): number => 1 - Math.pow(1 - clamp01(u), 3);

export const easeInOutCubic = (u: number): number => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** Overshoots 1 on the way, lands exactly on 0 at 0 and 1 at 1. */
export const easeOutBack = (u: number, overshoot = 1.4): number => {
  const x = clamp01(u) - 1;
  return 1 + (overshoot + 1) * x * x * x + overshoot * x * x;
};

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
