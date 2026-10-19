"use client";

import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { itemsReady } from "./can-continue";
import { CategoryTabs, panelId, tabId } from "./items/category-tabs";
import { Counter } from "./items/counter";
import { ItemTile } from "./items/item-tile";
import {
  ALL_CATEGORY,
  categoryTabs,
  continueState,
  filterItemsByCategory,
  pickedInCategory,
  quantityOf,
} from "./items/items-copy";
import { EDGE_FADE_CLASS, useEdgeFade } from "./items/use-edge-fade";

import { cn } from "@/lib/cn";

/** Question 3 body: category tabs, the live counter and the item tiles. */
export function ItemsBody(): ReactElement {
  const builder = useBuilder();
  const { catalog, packaging, lines } = builder;
  const idPrefix = useId();
  const [requested, setRequested] = useState(ALL_CATEGORY);
  const { ref: rowRef, fade: rowFade, onScroll: onRowScroll } = useEdgeFade<HTMLUListElement>();

  const names = useMemo(() => categoryTabs(catalog.categories, catalog.items), [catalog]);
  const tabs = useMemo(
    () => names.map((label) => ({ label, picked: pickedInCategory(lines, catalog.items, label) })),
    [names, lines, catalog.items],
  );

  if (!packaging) {
    return <p className="text-muted text-sm">Pick what your gift comes in first.</p>;
  }
  if (catalog.items.length === 0) {
    return (
      <p className="bg-warm text-muted rounded-md p-4 text-center text-sm">
        Nothing to pick here yet. Please check back soon.
      </p>
    );
  }

  const selected = names.includes(requested) ? requested : ALL_CATEGORY;
  const shown = filterItemsByCategory(catalog.items, selected);
  const blocking = continueState(builder.problems).message;

  return (
    <div className="space-y-3">
      <CategoryTabs tabs={tabs} selected={selected} onSelect={setRequested} idPrefix={idPrefix} />

      <div>
        <Counter
          count={builder.itemCount}
          minItems={packaging.minItems}
          maxItems={packaging.maxItems}
        />
        {blocking ? <p className="text-muted mt-1 text-xs wrap-anywhere">{blocking}</p> : null}
      </div>

      <div
        role="tabpanel"
        id={panelId(idPrefix)}
        aria-labelledby={tabId(idPrefix, names.indexOf(selected))}
      >
        {/* Phones: one scrolling row of 104px tiles, so the overview keeps its height.
            Desktop: three columns. */}
        <ul
          ref={rowRef}
          onScroll={onRowScroll}
          className={cn(
            "grid auto-cols-[104px] grid-flow-col snap-x snap-proximity gap-2 overflow-x-auto p-0.5 pb-1.5 [scrollbar-width:none]",
            "min-[900px]:grid-flow-row min-[900px]:grid-cols-3 min-[900px]:overflow-x-visible min-[900px]:gap-2.5",
            rowFade && EDGE_FADE_CLASS,
          )}
        >
          {shown.map((entry) => (
            <ItemTile
              key={entry.item.id}
              entry={entry}
              currency={catalog.currency}
              qty={quantityOf(lines, entry.item.id)}
              blockedReason={builder.addBlockedReason(entry.item.id)}
              onAdd={() => builder.addItem(entry.item.id)}
              onRemove={() => builder.removeItem(entry.item.id)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Item count is within min and max and the gift fits (text limits are checked later). */
export function useItemsCanContinue(): boolean {
  return itemsReady(useBuilder());
}
