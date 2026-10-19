"use client";

import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ColourSwatches } from "./colour-swatches";
import { moveAnnouncement } from "./reorder";
import { ReorderList } from "./reorder-list";
import type { ReorderRow } from "./reorder-list";

import { StepProgress } from "@/features/builder/components/progress";
import type { BuilderApi } from "@/features/builder/state";
import { stepHref } from "@/features/builder/state";

/** What this screen needs from the builder store. */
export type ArrangeBuilder = Pick<
  BuilderApi,
  | "country"
  | "catalog"
  | "packaging"
  | "design"
  | "lines"
  | "wrapperColor"
  | "ribbonColor"
  | "moveItem"
  | "shuffle"
  | "setWrapperColor"
  | "setRibbonColor"
>;

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors motion-reduce:transition-none";
const PRIMARY = `${BUTTON_BASE} bg-pink-strong text-on-pink hover:opacity-90`;
const SECONDARY = `${BUTTON_BASE} border-border bg-surface text-foreground hover:bg-surface-soft border-2`;

export function ArrangeView({ builder }: { builder: ArrangeBuilder }) {
  const { country, catalog, packaging, design, lines, wrapperColor, ribbonColor } = builder;
  const [announcement, setAnnouncement] = useState("");

  const sceneItems = useMemo(() => catalog.items.map((priced) => priced.item), [catalog.items]);
  const rows = useMemo<ReorderRow[]>(() => {
    const byId = new Map(sceneItems.map((item) => [item.id, item]));
    return lines.flatMap((line) => {
      const item = byId.get(line.itemId);
      return item ? [{ line, item }] : [];
    });
  }, [lines, sceneItems]);

  if (!packaging || !design) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <StepProgress current="arrange" />
        <p className="mt-6 text-lg">Pick a format and some items first, then come back here.</p>
        <Link href={stepHref(country, "format")} className={`${PRIMARY} mt-4`}>
          Choose a format
        </Link>
      </main>
    );
  }

  function handleMove(from: number, to: number) {
    const name = rows[from]?.item.name ?? "Item";
    builder.moveItem(from, to);
    setAnnouncement(moveAnnouncement(name, to, rows.length));
  }

  function handleShuffle() {
    builder.shuffle();
    // The invisible suffix flips so a screen reader repeats the sentence on every press.
    setAnnouncement((previous) =>
      previous.startsWith("Arrangement shuffled") && !previous.endsWith("​")
        ? "Arrangement shuffled​"
        : "Arrangement shuffled",
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <StepProgress current="arrange" />

      <div className="mt-6">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Arrange your gift</h1>
        <p className="text-muted mt-2 max-w-xl">
          Shuffle for a fresh look, or put the items in the order you like. Then pick the wrapping
          and ribbon colours.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
        <section aria-label="Your gift" className="lg:sticky lg:top-24">
          <div className="bg-surface-soft border-border shadow-pop rounded-blob mx-auto w-full max-w-[17rem] border p-3 sm:max-w-md sm:p-6 lg:max-w-none">
            <GiftScene design={design} packaging={packaging} items={sceneItems} motion />
          </div>
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={handleShuffle} className={SECONDARY}>
              <svg
                viewBox="0 0 20 20"
                className="mr-2 size-5"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M3 6h3c4 0 4 8 8 8h3m0 0l-2-2m2 2l-2 2M3 14h3c1 0 1.800-.6 2.500-1.500M17 6h-3c-1 0-1.800.6-2.500 1.500M17 6l-2-2m2 2l-2 2"
                  strokeWidth="1.800"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Shuffle
            </button>
          </div>
        </section>

        <div className="space-y-8">
          <section aria-labelledby="order-heading">
            <h2 id="order-heading" className="font-display text-lg font-bold">
              Order of items
            </h2>
            <p className="text-muted mb-3 text-sm">
              Use the arrows to move an item
              <span className="hidden [@media(pointer:fine)]:inline">, or drag it by the dots</span>
              .
            </p>
            {rows.length > 0 ? (
              <ReorderList rows={rows} onMove={handleMove} />
            ) : (
              <p className="text-muted">You have not picked any items yet.</p>
            )}
          </section>

          <ColourSwatches
            legend="Wrapping colour"
            options={packaging.wrapperColors}
            value={wrapperColor}
            onChange={builder.setWrapperColor}
          />
          <ColourSwatches
            legend="Ribbon colour"
            options={packaging.ribbonColors}
            value={ribbonColor}
            onChange={builder.setRibbonColor}
          />
        </div>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <nav
        aria-label="Builder steps"
        className="border-border mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6"
      >
        <Link href={stepHref(country, "items")} className={SECONDARY}>
          Back to items
        </Link>
        <Link href={stepHref(country, "personalise")} className={PRIMARY}>
          Continue to personalise
        </Link>
      </nav>
    </main>
  );
}
