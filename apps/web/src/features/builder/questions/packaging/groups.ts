import { PACKAGING_KINDS } from "@giftpop/contracts";
import type { PackagingKind, PricedPackaging } from "@giftpop/contracts";

/** Plain headings for each kind of packaging, in the order the groups are shown. */
export const KIND_HEADINGS: Record<PackagingKind, string> = {
  box: "Boxes",
  bouquet: "Bouquets",
  basket: "Baskets",
  mug: "Mugs",
  other: "More",
};

export interface PackagingGroup {
  kind: PackagingKind;
  heading: string;
  packagings: PricedPackaging[];
}

/**
 * How many columns of the shared tile grid a group takes: one per tile, up to the whole row.
 * Small groups then sit side by side ("Bouquets" and "Baskets" in one row) instead of each
 * leaving a row mostly empty.
 */
export function groupSpan(tileCount: number, columns: number): number {
  return Math.max(1, Math.min(tileCount, columns));
}

function isKind(value: string): value is PackagingKind {
  return (PACKAGING_KINDS as readonly string[]).includes(value);
}

/**
 * Groups packagings by `kind`, in the order of `PACKAGING_KINDS`, keeping the catalog order
 * inside a group. Empty groups are left out. A kind this build does not know (a newer API)
 * lands in "More" instead of disappearing.
 */
export function groupPackagings(packagings: readonly PricedPackaging[]): PackagingGroup[] {
  const buckets = new Map<PackagingKind, PricedPackaging[]>();
  for (const priced of packagings) {
    const kind: PackagingKind = isKind(priced.packaging.kind) ? priced.packaging.kind : "other";
    const bucket = buckets.get(kind) ?? [];
    bucket.push(priced);
    buckets.set(kind, bucket);
  }
  return PACKAGING_KINDS.flatMap((kind) => {
    const list = buckets.get(kind);
    return list && list.length > 0
      ? [{ kind, heading: KIND_HEADINGS[kind], packagings: list }]
      : [];
  });
}
