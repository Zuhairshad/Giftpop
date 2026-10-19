/**
 * Display-only dial codes keyed by ISO country code, shown as a prefix next to the phone field.
 * This is UI data: it never decides what the form accepts or what the API does.
 */
const DIAL_CODES: Readonly<Record<string, string>> = {
  US: "+1",
  CA: "+1",
  GB: "+44",
  SA: "+966",
  IN: "+91",
  PK: "+92",
  CN: "+86",
  AU: "+61",
  TR: "+90",
};

/** The dial code for a country such as "PK" ("+92"), or null when we have none. */
export function dialCodeFor(countryCode: string): string | null {
  return DIAL_CODES[countryCode.toUpperCase()] ?? null;
}

/**
 * Turns what the customer typed into the phone we send. A number that already starts with
 * "+" is kept; otherwise the dial code goes in front and leading zeros (the national
 * trunk prefix) are dropped. With no dial code the text is sent as typed.
 */
export function withDialCode(dialCode: string | null, typed: string): string {
  const text = typed.trim();
  if (text === "" || text.startsWith("+") || dialCode === null) return text;
  return `${dialCode} ${text.replace(/^0+(?=\d)/, "")}`;
}
