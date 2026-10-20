import { useId } from "react";

function hashOf(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * A clip or gradient id that stays unique when many copies share a page. The id also carries a
 * hash of `seed` (the outline and colours), so two separate React roots on one page (each
 * restarting `useId` at the same value) can only ever share an id when the definitions match.
 */
export function useArtId(kind: string, seed: string): string {
  return `${kind}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-${hashOf(seed)}`;
}
