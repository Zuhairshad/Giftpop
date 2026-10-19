"use client";

import type { CatalogResponse, PricedPackaging } from "@giftpop/contracts";
import { useId, useMemo } from "react";
import type { ReactElement } from "react";

import { priceLabel } from "../price-label";
import { SafeScene } from "../safe-scene";

import { packagingAvailability, pickRangeCopy } from "./format-copy";
import { buildSampleDesign } from "./sample-design";

interface PackagingTileProps {
  priced: PricedPackaging;
  catalog: Pick<CatalogResponse, "items" | "currency">;
  selected: boolean;
  onChoose: (priced: PricedPackaging) => void;
}

/**
 * One packaging: a small drawing of it with sample items, its name, how many items it takes and
 * its own price (the format only; the quote adds the items). The visible text starts with the
 * name so the accessible name does too.
 */
export function PackagingTile({
  priced,
  catalog,
  selected,
  onChoose,
}: PackagingTileProps): ReactElement {
  const { packaging } = priced;
  const noteId = useId();
  const availability = packagingAvailability(priced);
  const design = useMemo(() => buildSampleDesign(packaging, catalog.items), [packaging, catalog]);
  const items = useMemo(() => catalog.items.map((entry) => entry.item), [catalog]);

  return (
    <li className="flex">
      <button
        type="button"
        aria-disabled={!availability.available}
        aria-pressed={selected}
        aria-describedby={availability.reason ? noteId : undefined}
        onClick={() => {
          if (availability.available) onChoose(priced);
        }}
        className={`bg-surface rounded-md flex w-full flex-col gap-1 p-2 text-center transition-shadow motion-reduce:transition-none ${
          selected ? "ring-pink shadow-hairline ring-2" : "shadow-hairline hover:shadow-lift"
        } ${availability.available ? "cursor-pointer" : "cursor-not-allowed"}`}
      >
        <span
          aria-hidden="true"
          className={`bg-warm rounded-sm block p-1.5 ${availability.available ? "" : "opacity-50"}`}
        >
          <SafeScene
            design={design}
            packaging={packaging}
            items={items}
            className="mx-auto w-full max-w-24 min-[560px]:max-w-32"
          />
        </span>
        <span className="text-foreground px-1 text-sm leading-tight font-medium wrap-anywhere">
          {packaging.name}
        </span>
        <span className="text-muted px-1 text-xs leading-tight">
          {pickRangeCopy(packaging.minItems, packaging.maxItems)}
        </span>
        <span className="text-muted px-1 pb-1 text-xs leading-tight">
          {priceLabel(priced.priceMinor, catalog.currency)}
        </span>
        {availability.reason ? (
          <span id={noteId} className="text-warning px-1 pb-1 text-xs leading-tight font-semibold">
            {availability.reason}
          </span>
        ) : null}
      </button>
    </li>
  );
}
