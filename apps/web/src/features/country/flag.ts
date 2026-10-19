const REGIONAL_INDICATOR_A = 0x1f1e6;

/** Turns an ISO 3166-1 alpha-2 code ("pk", "PK") into its flag emoji, or "" when it is not two letters. */
export function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    ...[...upper].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65),
  );
}
