import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { shade } from "../../placeholders/color";

import { HeartBoxIllustration } from "./heart-box";
import { frontEdgeY, heartSamples, WALL_DEPTH } from "./heart-box-shape";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = HeartBoxIllustration;

function ids(markup: string): string[] {
  return Array.from(markup.matchAll(/\sid="([^"]+)"/g), (m) => m[1] ?? "");
}

describe("heart shape", () => {
  const pts = heartSamples();

  it("is symmetric about x = 500", () => {
    for (const [x, y] of pts) {
      const twin = pts.some(([mx, my]) => Math.abs(mx - (1000 - x)) < 3 && Math.abs(my - y) < 3);
      expect(twin).toBe(true);
    }
  });

  it("fits the opening contract", () => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(200);
    expect(Math.max(...xs)).toBeLessThanOrEqual(800);
    expect(Math.min(...xs)).toBeLessThan(205);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(355);
    expect(Math.min(...ys)).toBeLessThanOrEqual(365);
    expect(Math.max(...ys)).toBeCloseTo(650, 0);
    expect(WALL_DEPTH + Math.max(...ys)).toBeLessThan(900);
  });

  it("has the dip and point on the centre line", () => {
    expect(pts.some(([x, y]) => x === 500 && y === 420)).toBe(true);
    expect(pts.some(([x, y]) => x === 500 && y === 650)).toBe(true);
    expect(frontEdgeY(500)).toBeCloseTo(650, 0);
    expect(frontEdgeY(205)).toBeLessThan(frontEdgeY(400));
    expect(frontEdgeY(400)).toBeLessThan(frontEdgeY(500));
    expect(frontEdgeY(300)).toBeCloseTo(frontEdgeY(700), 0);
  });
});

describe("heart box art", () => {
  it("renders without NaN or undefined", () => {
    for (const C of [Back, Front]) {
      const out = renderToStaticMarkup(<C wrapper={WRAP} ribbon={RIBBON} />);
      expect(out).not.toMatch(/NaN|undefined/);
      expect(out).toContain("<path");
    }
  });

  it("follows the wrapper and ribbon colours", () => {
    const a = renderToStaticMarkup(<Front wrapper={WRAP} ribbon={RIBBON} />);
    const b = renderToStaticMarkup(<Front wrapper="#334455" ribbon="#aa2200" />);
    expect(a).toContain(WRAP);
    expect(a).toContain(RIBBON);
    expect(b).toContain("#334455");
    expect(b).toContain("#aa2200");
    expect(b).not.toContain(WRAP);
    expect(b).not.toContain(RIBBON);
    expect(a).toContain(shade(RIBBON, -0.34));
    const back = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    expect(back).toContain(WRAP);
    expect(back).toContain(RIBBON);
  });

  it("keeps ids unique when two copies share a tree", () => {
    const out = renderToStaticMarkup(
      <svg>
        <Back wrapper={WRAP} ribbon={RIBBON} />
        <Front wrapper={WRAP} ribbon={RIBBON} />
        <Back wrapper={WRAP} ribbon={RIBBON} />
        <Front wrapper={WRAP} ribbon={RIBBON} />
      </svg>,
    );
    const all = ids(out);
    expect(all.length).toBeGreaterThan(0);
    expect(new Set(all).size).toBe(all.length);
  });

  it("is decorative: no title or role", () => {
    const out = renderToStaticMarkup(<Front wrapper={WRAP} ribbon={RIBBON} />);
    expect(out).not.toMatch(/<title|role=/);
  });
});
