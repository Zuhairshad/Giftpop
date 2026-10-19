const SHORT_HEX = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
const LONG_HEX = /^#[0-9a-fA-F]{6}$/;

/** `<input type="color">` only takes `#rrggbb`. Expands `#abc`; anything else falls back. */
export function toColorInputValue(value: string, fallback = "#cccccc"): string {
  const short = SHORT_HEX.exec(value);
  if (short)
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return LONG_HEX.test(value) ? value.toLowerCase() : fallback;
}
