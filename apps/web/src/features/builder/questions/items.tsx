"use client";

import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { CategoryTabs, panelId, tabId } from "./items/category-tabs";
import { Counter } from "./items/counter";
import { ItemTile } from "./items/item-tile";
import {
  ALL_CATEGORY,
  categoryTabs,
  filterItemsByCategory,
  pickedInCategory,
  quantityOf,
} from "./items/items-copy";
import { groupListByCategory, splitByPickerStyle } from "./items/list-items";
import { MoreItemsList } from "./items/more-items-list";
import { EDGE_FADE_CLASS, useEdgeFade } from "./items/use-edge-fade";

import { cn } from "@/lib/cn";

/**
 * Question 3 body: category tabs, the live counter, the item tiles and, under them, the written
 * list of more items (`pickerStyle: "list"`). Both are ordinary items to the store and the scene.
 */
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
  const { tiles, list } = splitByPickerStyle(filterItemsByCategory(catalog.items, selected));
  const listGroups = groupListByCategory(list, names, selected);

  return (
    <div className="space-y-3">
      {/* Tabs and counter stay at the top of the surface's scroll area while the grid scrolls
          under them (desktop: the grid is several rows tall). Bleeds over the body's padding. */}
      <div className="bg-surface sticky top-0 z-10 -mx-4 space-y-3 px-4 min-[900px]:-mx-6 min-[900px]:border-b min-[900px]:border-border min-[900px]:px-6 min-[900px]:pb-3">
        <CategoryTabs tabs={tabs} selected={selected} onSelect={setRequested} idPrefix={idPrefix} />
        <Counter
          count={builder.itemCount}
          minItems={packaging.minItems}
          maxItems={packaging.maxItems}
        />
      </div>

      <div
        role="tabpanel"
        id={panelId(idPrefix)}
        aria-labelledby={tabId(idPrefix, names.indexOf(selected))}
      >
        {/* Phones: one scrolling row of 104px tiles, so the overview keeps its height.
            Desktop: three columns. Kept mounted (hidden) when a tab has only written items, so
            the edge-fade observer keeps watching the same element. */}
        <ul
          ref={rowRef}
          onScroll={onRowScroll}
          className={cn(
            "auto-cols-[104px] grid-flow-col snap-x snap-proximity gap-2 overflow-x-auto p-0.5 pb-1.5 [scrollbar-width:none]",
            "min-[900px]:grid-flow-row min-[900px]:grid-cols-3 min-[900px]:overflow-x-visible min-[900px]:gap-2.5",
            rowFade && EDGE_FADE_CLASS,
            tiles.length > 0 ? "grid" : "hidden",
          )}
        >
          {tiles.map((entry) => (
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
        <MoreItemsList
          groups={listGroups}
          hasTiles={tiles.length > 0}
          currency={catalog.currency}
          qtyOf={(itemId) => quantityOf(lines, itemId)}
          blockedReasonOf={builder.addBlockedReason}
          onAdd={(entry) => builder.addItem(entry.item.id)}
          onRemove={(entry) => builder.removeItem(entry.item.id)}
        />
      </div>
    </div>
  );
}
