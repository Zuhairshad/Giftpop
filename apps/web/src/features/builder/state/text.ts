/**
 * Cuts text to at most `max` UTF-16 code units (the unit the contracts count in),
 * without leaving half of a surrogate pair at the end.
 */
export function truncateText(text: string, max: number): string {
  if (max <= 0) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const last = cut.charCodeAt(cut.length - 1);
  const isHighSurrogate = last >= 0xd800 && last <= 0xdbff;
  return isHighSurrogate ? cut.slice(0, -1) : cut;
}
