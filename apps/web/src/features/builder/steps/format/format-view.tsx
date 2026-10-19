"use client";

import type { PricedPackaging } from "@giftpop/contracts";
import { useId, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { StepProgressView } from "../../components/progress";
import { stepHref } from "../../state";
import type { BuilderApi } from "../../state";

import {
  droppedItemNames,
  droppedItemsNotice,
  packagingAvailability,
  pickRangeCopy,
  visiblePackagings,
} from "./format-copy";
import { priceLabel } from "./price-label";
import { SafeScene } from "./safe-scene";
import { buildSampleDesign } from "./sample-design";

interface FormatViewProps {
  builder: BuilderApi;
  /** Moves to another page. The real step passes `router.push`. */
  navigate: (href: string) => void;
}

interface PackagingCardProps {
  priced: PricedPackaging;
  builder: BuilderApi;
  selected: boolean;
  onChoose: (priced: PricedPackaging) => void;
}

function PackagingCard({ priced, builder, selected, onChoose }: PackagingCardProps): ReactElement {
  const { catalog } = builder;
  const { packaging } = priced;
  const noteId = useId();
  const availability = packagingAvailability(priced);
  const design = useMemo(() => buildSampleDesign(packaging, catalog.items), [packaging, catalog]);
  const items = useMemo(() => catalog.items.map((entry) => entry.item), [catalog]);

  const ring = selected
    ? "border-pink ring-4 ring-pink-soft"
    : "border-border hover:border-pink-strong hover:-translate-y-0.5";
  const disabledStyle = availability.available ? "" : "opacity-70";

  return (
    <li className="flex">
      <button
        type="button"
        aria-disabled={!availability.available}
        aria-pressed={selected}
        aria-describedby={noteId}
        onClick={() => {
          if (availability.available) onChoose(priced);
        }}
        className={`bg-surface rounded-blob shadow-pop flex w-full flex-col overflow-hidden border-2 text-left transition motion-reduce:transition-none ${ring} ${
          availability.available ? "cursor-pointer" : "cursor-not-allowed"
        }`}
      >
        <span aria-hidden="true" className={`bg-surface-soft block p-4 ${disabledStyle}`}>
          <SafeScene
            design={design}
            packaging={packaging}
            items={items}
            className="mx-auto max-w-56 sm:max-w-72"
          />
        </span>
        <span className="flex flex-1 flex-col gap-1 p-5">
          <span className="flex items-baseline justify-between gap-3">
            <span className="font-display text-foreground text-xl font-bold">{packaging.name}</span>
            <span className="text-pink-strong font-bold whitespace-nowrap">
              {priceLabel(priced.priceMinor, catalog.currency)}
            </span>
          </span>
          <span className="text-foreground font-semibold">
            {pickRangeCopy(packaging.minItems, packaging.maxItems)}
          </span>
          {packaging.description ? (
            <span className="text-muted text-sm">{packaging.description}</span>
          ) : null}
          <span id={noteId} className="mt-2 text-sm font-semibold">
            {availability.reason ? (
              <span className="bg-surface-soft text-muted inline-block rounded-full px-3 py-1">
                {availability.reason}
              </span>
            ) : selected ? (
              <span className="bg-pink-soft text-pink-strong inline-block rounded-full px-3 py-1">
                Your current format
              </span>
            ) : (
              <span className="text-pink-strong">Choose {packaging.name}</span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

function EmptyState(): ReactElement {
  return (
    <div className="bg-surface-soft rounded-blob mx-auto max-w-md p-8 text-center">
      <h2 className="font-display text-foreground text-2xl font-bold">Nothing to build here yet</h2>
      <p className="text-muted mt-2">
        We have no gift formats for this country right now. Please check back soon.
      </p>
    </div>
  );
}

/** Step 1 screen. Takes the builder as a prop so it can be tested and previewed without the store. */
export function FormatView({ builder, navigate }: FormatViewProps): ReactElement {
  const { catalog, country } = builder;
  const packagings = visiblePackagings(catalog);
  const [notice, setNotice] = useState<string | null>(null);

  const goToItems = () => navigate(stepHref(country, "items"));

  const choose = (priced: PricedPackaging) => {
    const { droppedItemIds } = builder.choosePackaging(priced.packaging.id);
    const text = droppedItemsNotice(
      priced.packaging.name,
      droppedItemNames(droppedItemIds, catalog),
    );
    if (text) {
      setNotice(text);
      return;
    }
    setNotice(null);
    goToItems();
  };

  return (
    <div>
      <StepProgressView current="format" country={country} />
      <h1 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
        Pick a format
      </h1>
      <p className="text-muted mt-2 max-w-xl">
        This is the packaging your gift comes in. You choose what goes inside next.
      </p>

      {notice ? (
        <div
          role="status"
          className="bg-butter/40 border-butter text-foreground rounded-card mt-6 flex flex-col gap-3 border-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-semibold">{notice}</p>
          <button
            type="button"
            onClick={goToItems}
            className="bg-pink text-on-pink hover:bg-pink-strong min-h-11 shrink-0 rounded-full px-5 py-2 font-bold"
          >
            Continue to items
          </button>
        </div>
      ) : null}

      <div className="mt-8">
        {packagings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packagings.map((priced) => (
                <PackagingCard
                  key={priced.packaging.id}
                  priced={priced}
                  builder={builder}
                  selected={builder.packaging?.id === priced.packaging.id}
                  onChoose={choose}
                />
              ))}
            </ul>
            <p className="text-muted mt-6 text-sm">
              Prices shown are for the format. The items you pick are added on top.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
