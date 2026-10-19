/** Black or white, whichever reads better on top of `hex` (for the tick on a selected swatch). */
export function readableInk(hex: string): "#000000" | "#ffffff" {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return "#000000";
  const value = parseInt(match[1], 16);
  const channel = (shift: number): number => {
    const c = ((value >> shift) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

export function sameColour(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
