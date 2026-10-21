"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../../state";
import { findPricedItem } from "../../state/catalog-lookup";

import { describeGiftChanges, giftChangeLines, splitUnsold, unsoldNote } from "./gift-changes";
import { useReadyMadeOrigin } from "./use-ready-made-origin";

/**
 * When the gift began as a ready-made one: its name and whether it is still the gift on the
 * catalog card, so the customer knows why the price may differ. Nothing for a gift built from scratch.
 */
export function ReadyMadeStatus(): ReactElement | null {
  const { design, country, catalog } = useBuilder();
  const origin = useReadyMadeOrigin(country);
  if (!design || !origin) return null;

  // An item the catalog no longer sells is left out by the builder, so it is not the customer's change.
  const nameOf = (itemId: string): string =>
    findPricedItem(catalog, itemId)?.item.name ?? "An item that is no longer sold";
  const { sold, unsold } = splitUnsold(
    origin.design,
    (itemId) => findPricedItem(catalog, itemId) !== undefined,
  );
  const changes = describeGiftChanges(sold, design);
  const lines = giftChangeLines(changes, nameOf);
  const leftOut = unsoldNote(unsold.length);

  return (
    <section
      aria-labelledby="review-ready-made-heading"
      className="bg-warm space-y-1 rounded-md p-3"
    >
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">Ready-made gift</p>
      <h3 id="review-ready-made-heading" className="text-sm font-semibold wrap-anywhere">
        {origin.title}
      </h3>
      {changes.changed ? (
        <>
          <p className="text-sm font-semibold">You changed this gift</p>
          <ul className="list-disc space-y-0.5 pl-5 text-sm wrap-anywhere">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {leftOut ? <p className="text-sm">{leftOut}</p> : null}
          <p className="text-muted text-sm">The price may differ from the catalog card.</p>
        </>
      ) : leftOut ? (
        <>
          <p className="text-sm font-semibold">Ordered as is</p>
          <p className="text-sm">{leftOut}</p>
          <p className="text-muted text-sm">The price may differ from the catalog card.</p>
        </>
      ) : (
        <p className="text-sm">Ordered as is: the same gift as on the catalog card.</p>
      )}
    </section>
  );
}
