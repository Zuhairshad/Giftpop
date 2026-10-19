function channel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Mixes a `#rrggbb` colour towards black (`amount` < 0) or white (`amount` > 0). */
export function shade(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const target = amount < 0 ? 0 : 255;
  const k = Math.abs(amount);
  const out = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16);
    return channel(v + (target - v) * k)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${out.join("")}`;
}
