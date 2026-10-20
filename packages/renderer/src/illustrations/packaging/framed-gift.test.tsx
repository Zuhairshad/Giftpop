import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FRAMED_GIFT_FRAME,
  FRAMED_GIFT_HANGER,
  FRAMED_GIFT_WINDOW,
} from "../../layouts/framed-gift";

import { BoxGridBack } from "./box-grid-back";
import { FramedGiftIllustration } from "./framed-gift";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = FramedGiftIllustration;

describe("framed gift art", () => {
  it("renders paths without NaN or undefined", () => {
    for (const C of [Back, Front]) {
      const out = renderToStaticMarkup(<C wrapper={WRAP} ribbon={RIBBON} />);
      expect(out).not.toMatch(/NaN|undefined/);
      expect(out).toContain("<path");
    }
  });

  it("follows the wrapper and ribbon colours", () => {
    const a = renderToStaticMarkup(
      <>
        <Back wrapper={WRAP} ribbon={RIBBON} />
        <Front wrapper={WRAP} ribbon={RIBBON} />
      </>,
    );
    const b = renderToStaticMarkup(
      <>
        <Back wrapper="#334455" ribbon="#aa2200" />
        <Front wrapper="#334455" ribbon="#aa2200" />
      </>,
    );
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

  it("draws the frame, window and hanger where the layout expects them", () => {
    const back = renderToStaticMarkup(<Back wrapper={WRAP} ribbon={RIBBON} />);
    expect(back).toContain(`x="${FRAMED_GIFT_FRAME.x}" y="${FRAMED_GIFT_FRAME.y}"`);
    expect(back).toContain(`x="${FRAMED_GIFT_WINDOW.x}" y="${FRAMED_GIFT_WINDOW.y}"`);
    expect(back).toContain(`cx="${FRAMED_GIFT_HANGER.x}" cy="${FRAMED_GIFT_HANGER.y}"`);
  });
});
