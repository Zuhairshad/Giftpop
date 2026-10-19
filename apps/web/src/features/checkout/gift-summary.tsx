"use client";

import { GiftScene } from "@giftpop/renderer";
import type { ReactElement } from "react";
import { useId, useMemo, useState } from "react";

import { giftContentsLine, giftRecipientLine } from "./gift-summary-model";

import {
  buildPersonalisationRows,
  buildReviewLines,
} from "@/features/builder/questions/review/review-lines";
import type { BuilderApi } from "@/features/builder/state";
import { META_LABEL, WELL } from "@/features/order/ui";
import { optimisedImageUrl } from "@/lib/image-url";

/**
 * The finished gift, read-only. Phones get a compact row (small picture, packaging, item count,
 * recipient) with the items and card behind "Show gift details", so the form starts above the
 * fold. From `lg` up the picture is large and every detail shows in a sticky column.
 */
export function GiftSummary({ builder }: { builder: BuilderApi }): ReactElement | null {
  const { design, packaging, catalog } = builder;
  const items = useMemo(() => catalog.items.map((priced) => priced.item), [catalog.items]);
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  if (!design || !packaging) return null;

  const lines = buildReviewLines(builder.lines, catalog, builder.itemNames);
  const rows = buildPersonalisationRows({
    cardMessage: builder.cardMessage,
    recipientName: builder.recipientName,
    lines,
  });
  const recipient = giftRecipientLine(builder.recipientName);

  return (
    <section
      aria-labelledby="checkout-gift-heading"
      className="bg-surface shadow-hairline min-w-0 rounded-lg p-3 sm:p-4 lg:sticky lg:top-6 lg:p-6"
    >
      <div className="flex items-center gap-3 sm:gap-4 lg:block">
        <div className={`${WELL} w-18 shrink-0 p-1 sm:w-22 lg:w-full lg:p-4`}>
          <div className="mx-auto lg:w-[min(100%,15rem)]">
            <GiftScene
              imageUrl={optimisedImageUrl}
              design={design}
              packaging={packaging}
              items={items}
            />
          </div>
        </div>
        <div className="min-w-0 flex-1 lg:mt-5">
          <h2
            id="checkout-gift-heading"
            className="font-display text-xl leading-tight font-bold tracking-tight lg:text-2xl"
          >
            Your gift
          </h2>
          <p className="text-ink-2 text-sm wrap-anywhere sm:text-base">
            {giftContentsLine(packaging.name, builder.itemCount)}
          </p>
          {recipient ? (
            <p className="text-ink-2 text-sm wrap-anywhere sm:text-base">{recipient}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
        className="text-ink hover:bg-warm mt-2 flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-2 text-sm font-semibold lg:hidden"
      >
        {open ? "Hide gift details" : "Show gift details"}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`size-5 shrink-0 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={detailsId}
        className={`${open ? "" : "hidden"} space-y-4 px-2 pt-2 pb-1 lg:mt-5 lg:block lg:px-0 lg:pt-0 lg:pb-0`}
      >
        <div>
          <h3 className="font-semibold wrap-anywhere">In your {packaging.name}</h3>
          <ul className="mt-1 space-y-1">
            {lines.map((line) => (
              <li key={line.itemId} className="wrap-anywhere">
                <span className="font-semibold">
                  {line.qty} &times; {line.name}
                </span>
                {line.customName ? (
                  <span className="text-muted text-sm"> named &ldquo;{line.customName}&rdquo;</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className={META_LABEL}>{row.label}</dt>
              <dd className="wrap-anywhere whitespace-pre-line">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
