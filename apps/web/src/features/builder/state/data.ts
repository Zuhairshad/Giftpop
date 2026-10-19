import type { DesignItem, HexColor } from "@giftpop/contracts";

/** What the visitor has chosen so far. Everything else is derived from this plus the catalog. */
export interface BuilderData {
  packagingId: string | null;
  /** Item lines in slot order. A line's `slot` always equals its index. */
  lines: readonly DesignItem[];
  wrapperColor: HexColor | null;
  ribbonColor: HexColor | null;
  arrangementSeed: number;
  cardMessage: string;
  recipientName: string;
  itemNames: Readonly<Record<string, string>>;
}

/** Fixed seed used before the visitor chooses anything, so server and client render the same. */
export const INITIAL_SEED = 1;

export const MAX_SEED = 0xffffffff;

export function emptyData(): BuilderData {
  return {
    packagingId: null,
    lines: [],
    wrapperColor: null,
    ribbonColor: null,
    arrangementSeed: INITIAL_SEED,
    cardMessage: "",
    recipientName: "",
    itemNames: {},
  };
}

/** Gives every line its index as slot. */
export function renumber(lines: readonly DesignItem[]): DesignItem[] {
  return lines.map((line, index) => ({ itemId: line.itemId, qty: line.qty, slot: index }));
}

/** A new seed from the browser's random source. Only ever called inside actions. */
export function randomSeed(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] ?? INITIAL_SEED;
}
