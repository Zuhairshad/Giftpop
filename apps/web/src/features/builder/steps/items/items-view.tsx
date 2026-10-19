"use client";

import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { StepProgressView } from "../../components/progress";
import { stepHref } from "../../state";
import type { BuilderApi } from "../../state";
import { pickRangeCopy } from "../format/format-copy";

import { CategoryTabs, panelId, tabId } from "./category-tabs";
import { MobileSummary, SidebarSummary } from "./gift-summary";
import { ItemCard } from "./item-card";
import {
  ALL_CATEGORY,
  categoryTabs,
  continueState,
  filterItemsByCategory,
  quantityOf,
} from "./items-copy";
import { ItemsSkeleton } from "./items-skeleton";

interface ItemsViewProps {
  builder: BuilderApi;
  /** Moves to another page. The real step passes `router.push`. */
  navigate: (href: string) => void;
}

/** Step 2 screen. Takes the builder as a prop so it can be tested and previewed without the store. */
export function ItemsView({ builder, navigate }: ItemsViewProps): ReactElement {
  const { catalog, country, packaging, design, problems, lines } = builder;
  const idPrefix = useId();
  const tabs = useMemo(() => categoryTabs(catalog.categories, catalog.items), [catalog]);
  const [requested, setRequested] = useState(ALL_CATEGORY);
  const items = useMemo(() => catalog.items.map((entry) => entry.item), [catalog]);

  const selected = tabs.includes(requested) ? requested : ALL_CATEGORY;
  const shown = filterItemsByCategory(catalog.items, selected);
  const selectedIndex = tabs.indexOf(selected);

  if (!packaging || !design) {
    // Before the store hydrates (and in the brief gap before the step guard sends a visitor with
    // no format back), hold the grid's space so nothing shifts when the items arrive.
    return <ItemsSkeleton country={country} />;
  }

  const summary = {
    design,
    packaging,
    items,
    itemCount: builder.itemCount,
    usedUnits: builder.usedUnits,
    next: continueState(problems),
    onContinue: () => navigate(stepHref(country, "arrange")),
  };

  return (
    <div className="pb-40 lg:pb-0">
      <StepProgressView current="items" country={country} />
      <h1 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
        Pick your items
      </h1>
      <p className="text-muted mt-2">
        {packaging.name}. {pickRangeCopy(packaging.minItems, packaging.maxItems)}.
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div>
          {catalog.items.length === 0 ? (
            <p className="bg-surface-soft text-muted rounded-card p-6 text-center">
              Nothing to pick here yet. Please check back soon.
            </p>
          ) : (
            <>
              <CategoryTabs
                tabs={tabs}
                selected={selected}
                onSelect={setRequested}
                idPrefix={idPrefix}
              />
              <div
                role="tabpanel"
                id={panelId(idPrefix)}
                aria-labelledby={tabId(idPrefix, selectedIndex)}
                className="mt-4"
              >
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {shown.map((entry) => (
                    <ItemCard
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
            </>
          )}
        </div>

        <div className="hidden lg:sticky lg:top-24 lg:block">
          <SidebarSummary {...summary} />
        </div>
      </div>

      <div className="lg:hidden">
        <MobileSummary {...summary} />
      </div>
    </div>
  );
}
