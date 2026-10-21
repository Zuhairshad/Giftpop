"use client";

import type { ReactElement } from "react";

import { useBuilder } from "../../state";
import { findPricedItem } from "../../state/catalog-lookup";

import { describeGiftChanges, giftChangeLines } from "./gift-changes";
import { useReadyMadeOrigin } from "./use-ready-made-origin";

/**
 * When the gift began as a ready-made one: its name and whether it is still the gift on the
 * catalog card, so the customer knows why the price may differ. Nothing for a gift built from scratch.
 */
export function ReadyMadeStatus(): ReactElement | null {
  const { design, country, catalog } = useBuilder();
  const origin = useReadyMadeOrigin(country);
  if (!design || !origin) return null;

  const changes = describeGiftChanges(origin.design, design);
  const lines = giftChangeLines(
    changes,
    (itemId) => findPricedItem(catalog, itemId)?.item.name ?? "An item that is no longer sold",
  );

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
          <p className="text-muted text-sm">The price may differ from the catalog card.</p>
        </>
      ) : (
        <p className="text-sm">Ordered as is: the same gift as on the catalog card.</p>
      )}
    </section>
  );
}
