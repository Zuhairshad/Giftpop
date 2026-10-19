import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";
import { useMemo } from "react";
import type { ReactElement } from "react";

import { StepProgress } from "../../components/progress";
import { stepHref } from "../../state";
import type { BuilderApi } from "../../state";

import { PriceSection } from "./price-section";
import { buildPersonalisationRows, buildReviewLines } from "./review-lines";
import { SharePanel } from "./share-panel";

import { checkoutHref } from "@/features/share/links";

const PRIMARY =
  "bg-pink text-on-pink hover:bg-pink-strong inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors";

type ReviewScreenProps = {
  builder: BuilderApi;
  /** Set after a shared gift was loaded and some items could not come along. */
  leftOutNotice: string | null;
};

/** The review step's content. Reads the builder and shows only what it holds and what the quote says. */
export function ReviewScreen({ builder, leftOutNotice }: ReviewScreenProps): ReactElement {
  const { design, packaging, catalog, country, problems } = builder;
  const items = useMemo(() => catalog.items.map((priced) => priced.item), [catalog.items]);

  if (!design || !packaging) {
    return (
      <section className="space-y-4 py-6">
        <StepProgress current="review" />
        <h1 className="font-display text-3xl font-bold">Pick a format first</h1>
        <p className="text-muted">Choose how your gift is packed before you review it.</p>
        <Link href={stepHref(country, "format")} className={PRIMARY}>
          Choose a format
        </Link>
      </section>
    );
  }

  const lines = buildReviewLines(builder.lines, catalog, builder.itemNames);
  const personalisation = buildPersonalisationRows({
    cardMessage: builder.cardMessage,
    recipientName: builder.recipientName,
    lines,
  });
  const blocked = problems.length > 0;

  return (
    <div className="space-y-8">
      <StepProgress current="review" />
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Review your gift</h1>

      {leftOutNotice ? (
        <p role="note" className="bg-butter text-on-accent rounded-soft p-3 text-sm font-semibold">
          {leftOutNotice}
        </p>
      ) : null}

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="mx-auto w-[min(100%,28rem)] md:w-full">
          <GiftScene design={design} packaging={packaging} items={items} />
        </div>

        <div className="space-y-6">
          <section aria-labelledby="review-items-heading">
            <h2 id="review-items-heading" className="font-display text-2xl font-bold">
              In your {packaging.name}
            </h2>
            <ul className="mt-2 space-y-1.5">
              {lines.map((line) => (
                <li key={line.itemId} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">
                    {line.qty} &times; {line.name}
                  </span>
                  {line.customName ? (
                    <span className="text-muted text-sm">
                      named &ldquo;{line.customName}&rdquo;
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="review-personal-heading">
            <h2 id="review-personal-heading" className="font-display text-2xl font-bold">
              Personal touches
            </h2>
            <dl className="mt-2 space-y-2">
              {personalisation.map((row) => (
                <div key={row.label}>
                  <dt className="text-muted text-sm font-bold">{row.label}</dt>
                  <dd className="wrap-anywhere whitespace-pre-line">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <PriceSection quote={builder.quote} status={builder.quoteStatus} />

      {blocked ? (
        <div
          id="review-problems"
          role="alert"
          className="bg-surface-soft border-border rounded-soft space-y-2 border p-4"
        >
          <p className="font-bold">Fix this before you continue</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {problems.map((problem) => (
              <li key={`${problem.code}-${problem.itemId ?? problem.field ?? ""}`}>
                {problem.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-border grid gap-8 border-t pt-8 md:grid-cols-2 md:items-start">
        <SharePanel country={country} design={design} />

        <section aria-labelledby="checkout-heading" className="space-y-3">
          <h2 id="checkout-heading" className="font-display text-2xl font-bold">
            Ready to order?
          </h2>
          {blocked ? (
            <>
              <button
                type="button"
                aria-disabled="true"
                aria-describedby="review-problems review-blocked-hint"
                className={`${PRIMARY} cursor-not-allowed opacity-50`}
              >
                Continue to checkout
              </button>
              <p id="review-blocked-hint" className="text-muted text-sm">
                Checkout opens once the problems above are fixed. Go back to a step to fix them.
              </p>
            </>
          ) : (
            <Link href={checkoutHref(country)} className={PRIMARY}>
              Continue to checkout
            </Link>
          )}
          <p>
            <Link
              href={stepHref(country, "personalise")}
              className="text-pink-strong text-sm font-semibold underline underline-offset-4"
            >
              Back to personalise
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
