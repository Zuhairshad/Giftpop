"use client";

import type { PricedItem } from "@giftpop/contracts";
import { useId } from "react";
import type { ReactElement } from "react";

import { ItemRow } from "./item-row";
import type { ListGroup } from "./list-items";
import { listIntro } from "./list-items";

interface MoreItemsListProps {
  groups: readonly ListGroup[];
  /** The tab also shows tiles, so the list sits "below" them. */
  hasTiles: boolean;
  currency: string;
  qtyOf: (itemId: string) => number;
  blockedReasonOf: (itemId: string) => string | null;
  onAdd: (entry: PricedItem) => void;
  onRemove: (entry: PricedItem) => void;
}

/**
 * The written list of more items, under the grid (or in its place when a tab has only written
 * items). Rows are grouped by category with a small heading on the "All" tab. No dropdowns.
 */
export function MoreItemsList({
  groups,
  hasTiles,
  currency,
  qtyOf,
  blockedReasonOf,
  onAdd,
  onRemove,
}: MoreItemsListProps): ReactElement | null {
  const headingId = useId();
  const lineId = useId();
  if (groups.length === 0) return null;
  const intro = listIntro(hasTiles);

  return (
    <section
      aria-labelledby={intro.heading ? headingId : lineId}
      className={hasTiles ? "border-border mt-4 border-t pt-4" : undefined}
    >
      {intro.heading ? (
        <h3 id={headingId} className="text-foreground text-base font-semibold">
          {intro.heading}
        </h3>
      ) : null}
      <p id={lineId} className="text-muted mt-0.5 text-sm">
        {intro.line}
      </p>

      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.heading ?? "rows"}>
            {group.heading ? (
              <h4 className="text-muted mb-1.5 text-xs font-semibold tracking-wide uppercase">
                {group.heading}
              </h4>
            ) : null}
            <ul className="space-y-2 p-0.5">
              {group.entries.map((entry) => (
                <ItemRow
                  key={entry.item.id}
                  entry={entry}
                  currency={currency}
                  qty={qtyOf(entry.item.id)}
                  blockedReason={blockedReasonOf(entry.item.id)}
                  onAdd={() => onAdd(entry)}
                  onRemove={() => onRemove(entry)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
