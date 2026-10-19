/** Every launch currency uses two decimal places, so one constant covers them all. */
const MINOR_DIGITS = 2;
const MINOR_FACTOR = 10 ** MINOR_DIGITS;

const PLAIN_AMOUNT = /^(\d*)(?:\.(\d*))?$/;
const GROUPED_AMOUNT = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;

/**
 * Turns what staff type in major units ("12.50", "1,200") into integer minor
 * units (1250, 120000). Works on the decimal string, never on a float: extra
 * decimals round half up on the digit after the second ("12.345" is 1235).
 * Returns null for anything that is not a non-negative amount.
 */
export function majorToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const text = GROUPED_AMOUNT.test(trimmed) ? trimmed.replaceAll(",", "") : trimmed;

  const match = PLAIN_AMOUNT.exec(text);
  if (!match) return null;
  const whole = match[1] ?? "";
  const fraction = match[2] ?? "";
  if (whole === "" && fraction === "") return null;

  const wholeUnits = whole === "" ? 0 : Number(whole);
  const padded = fraction.padEnd(MINOR_DIGITS, "0");
  const kept = Number(padded.slice(0, MINOR_DIGITS));
  const roundUp = padded.length > MINOR_DIGITS && Number(padded.charAt(MINOR_DIGITS)) >= 5;

  const minor = wholeUnits * MINOR_FACTOR + kept + (roundUp ? 1 : 0);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Shows integer minor units as a major-unit string for an input ("1250" becomes "12.50"). */
export function minorToMajor(minor: number): string {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`Expected an integer amount in minor units, got ${minor}`);
  }
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR_FACTOR);
  const fraction = String(abs % MINOR_FACTOR).padStart(MINOR_DIGITS, "0");
  return `${sign}${whole}.${fraction}`;
}
