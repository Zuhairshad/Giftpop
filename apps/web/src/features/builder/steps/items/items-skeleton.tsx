import type { CountryCode } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { StepProgressView } from "../../components/progress";

const PLACEHOLDER_CARDS = 6;
const BAR = "bg-surface-soft block rounded-full";

/** One card with the real card's padding, art box and two text lines, so the grid keeps its height. */
function CardPlaceholder(): ReactElement {
  return (
    <li className="flex">
      <div className="bg-surface rounded-card border-border flex w-full flex-col items-center gap-1 border-2 p-3">
        <span className="bg-surface-soft rounded-card block aspect-square w-full max-w-28" />
        <span className={`${BAR} h-[1.09375rem] w-3/4`} />
        <span className={`${BAR} h-5 w-1/2`} />
      </div>
    </li>
  );
}

/**
 * Stands in for the items step while it loads and before the builder store hydrates, with the
 * same progress bar, heading and grid as the real step. Without it the step rendered one line
 * of text and the footer jumped down when the grid arrived (layout shift, accessibility audit).
 */
export function ItemsSkeleton({ country }: { country: CountryCode }): ReactElement {
  return (
    <div className="pb-40 lg:pb-0" aria-busy="true">
      <StepProgressView current="items" country={country} />
      <h1 className="font-display text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
        Pick your items
      </h1>
      <p className="text-muted mt-2">
        <span className="sr-only" role="status">
          Loading items
        </span>
        <span aria-hidden="true" className={`${BAR} h-6 w-48`} />
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div>
          <div aria-hidden="true" className="flex gap-2 pb-2">
            <span className={`${BAR} h-11 w-16`} />
            <span className={`${BAR} h-11 w-24`} />
            <span className={`${BAR} h-11 w-20`} />
          </div>
          <ul aria-hidden="true" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
              <CardPlaceholder key={index} />
            ))}
          </ul>
        </div>
        <div aria-hidden="true" className="bg-surface-soft rounded-blob hidden h-96 lg:block" />
      </div>
    </div>
  );
}
