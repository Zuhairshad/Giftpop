import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PHOTO_BOUQUET_GATHER } from "../../layouts/photo-bouquet";

import { BouquetFanIllustration } from "./bouquet-fan";
import { PhotoBouquetIllustration } from "./photo-bouquet";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = PhotoBouquetIllustration;
const FanBack = BouquetFanIllustration.Back;

describe("photo bouquet art", () => {
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

  it("is drawn differently from the bouquet fan", () => {
    const own = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    const fan = renderToStaticMarkup(<FanBack wrapper={WRAP} ribbon={RIBBON} />);
    expect(own).not.toEqual(fan);
  });

  it("starts every stem at the layout's gather point", () => {
    const { x, y } = PHOTO_BOUQUET_GATHER;
    const back = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    const starts = Array.from(back.matchAll(/M(\d+) (\d+)Q/g), (m) => [Number(m[1]), Number(m[2])]);
    expect(starts.length).toBeGreaterThan(0);
    for (const start of starts) expect(start).toEqual([x, y]);
  });
});
