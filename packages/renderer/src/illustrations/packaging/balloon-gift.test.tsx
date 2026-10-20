import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BALLOON_GIFT_KNOT } from "../../layouts/balloon-gift";

import { BalloonGiftIllustration } from "./balloon-gift";
import { BoxGridBack } from "./box-grid-back";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = BalloonGiftIllustration;

describe("balloon gift art", () => {
  it("renders paths without NaN or undefined", () => {
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
    expect(b).not.toContain(WRAP);
    expect(b).not.toContain(RIBBON);
  });

  it("is drawn differently from the box grid", () => {
    const own = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    const other = renderToStaticMarkup(<BoxGridBack wrapper={WRAP} ribbon={RIBBON} />);
    expect(own).not.toEqual(other);
  });

  it("starts every string and seats the bow at the layout's knot", () => {
    const { x, y } = BALLOON_GIFT_KNOT;
    const back = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    const starts = Array.from(back.matchAll(/M(\d+) (\d+)Q/g), (m) => [Number(m[1]), Number(m[2])]);
    expect(starts.length).toBeGreaterThan(0);
    for (const start of starts) expect(start).toEqual([x, y]);

    const front = renderToStaticMarkup(<Front wrapper={WRAP} ribbon={RIBBON} />);
    expect(front).toContain(`translate(${x} ${y + 4})`);
  });
});
