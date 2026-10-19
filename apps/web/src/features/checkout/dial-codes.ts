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
