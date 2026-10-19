/** Expand `#rgb` or `#rrggbb` to `[r, g, b]`. Anything unparseable becomes mid grey. */
export function parseHex(hex: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  const digits = match?.[1];
  if (!digits) return [128, 128, 128];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((c) => c + c)
          .join("")
      : digits;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Move a colour towards black (`amount` < 0) or white (`amount` > 0), amount in [-1, 1]. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const t = Math.abs(amount);
  const channels = parseHex(hex).map((c) =>
    Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("")}`;
}
