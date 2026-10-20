import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BoxGridBack } from "./box-grid-back";
import { SnackHamperIllustration } from "./snack-hamper";

const WRAP = "#e08a9b";
const RIBBON = "#2a9d8f";
const { Back, Front } = SnackHamperIllustration;

describe("snack hamper art", () => {
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

  it("draws the front rim at the layout's rim line", () => {
    const front = renderToStaticMarkup(<Front wrapper={WRAP} ribbon={RIBBON} />);
    expect(front).toContain("M130 680H870");
  });
});
