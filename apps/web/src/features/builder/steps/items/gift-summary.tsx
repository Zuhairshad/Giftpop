"use client";

import type { Design, Item, Packaging } from "@giftpop/contracts";
import { useId } from "react";
import type { ReactElement } from "react";

import { SafeScene } from "../format/safe-scene";

import { counterText } from "./items-copy";
import type { ContinueState } from "./items-copy";

interface GiftSummaryProps {
  design: Design;
  packaging: Packaging;
  items: readonly Item[];
  itemCount: number;
  usedUnits: number;
  next: ContinueState;
  onContinue: () => void;
}

const CONTINUE_BASE =
  "min-h-11 rounded-full px-6 py-2 text-center font-bold transition-colors motion-reduce:transition-none";

function ContinueButton({
  next,
  onContinue,
  messageId,
  className = "",
  label = "Continue to arrange",
}: {
  next: ContinueState;
  onContinue: () => void;
  messageId: string;
  className?: string;
  label?: string;
}): ReactElement {
  return (
    <button
      type="button"
      aria-disabled={!next.enabled}
      aria-describedby={next.message ? messageId : undefined}
      aria-label="Continue to arrange"
      onClick={() => {
        if (next.enabled) onContinue();
      }}
      className={`${CONTINUE_BASE} ${className} ${
        next.enabled
          ? "bg-pink text-on-pink hover:bg-pink-strong"
          : "bg-surface-soft text-muted cursor-not-allowed"
      }`}
    >
      {label}
    </button>
  );
}

/** The counter. A polite live region, so a screen reader hears each change without being interrupted. */
function Counter({ packaging, itemCount }: Pick<GiftSummaryProps, "packaging" | "itemCount">) {
  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      className="text-foreground text-base font-bold sm:text-lg sm:whitespace-nowrap"
    >
      {counterText(itemCount, packaging.minItems, packaging.maxItems)}
    </p>
  );
}

/** Desktop: sticks to the side of the item grid. */
export function SidebarSummary(props: GiftSummaryProps): ReactElement {
  const { design, packaging, items, itemCount, usedUnits, next, onContinue } = props;
  const messageId = useId();
  return (
    <section
      aria-label="Your gift so far"
      className="bg-surface rounded-blob shadow-pop border-border border-2 p-5"
    >
      <div className="bg-surface-soft rounded-card p-3">
        <SafeScene design={design} packaging={packaging} items={items} motion />
      </div>
      <h2 className="font-display text-foreground mt-4 text-xl font-bold">{packaging.name}</h2>
      <Counter packaging={packaging} itemCount={itemCount} />
      <p className="text-muted text-sm">
        Space used: {usedUnits} of {packaging.capacityUnits}
      </p>
      {next.message ? (
        <p id={messageId} className="text-muted mt-2 text-sm font-semibold">
          {next.message}
        </p>
      ) : null}
      <ContinueButton
        next={next}
        onContinue={onContinue}
        messageId={messageId}
        className="mt-4 w-full"
      />
    </section>
  );
}

/** Phone: a bar fixed to the bottom, so the gift and Continue never scroll away. */
export function MobileSummary(props: GiftSummaryProps): ReactElement {
  const { design, packaging, items, itemCount, next, onContinue } = props;
  const messageId = useId();
  return (
    <section
      aria-label="Your gift so far"
      className="bg-surface/95 border-border fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 px-4 py-3 backdrop-blur"
    >
      <div className="bg-surface-soft rounded-card w-20 shrink-0 p-1">
        <SafeScene design={design} packaging={packaging} items={items} motion />
      </div>
      <div className="min-w-0 flex-1">
        <Counter packaging={packaging} itemCount={itemCount} />
        {next.message ? (
          <p id={messageId} className="text-muted line-clamp-2 text-xs font-semibold">
            {next.message}
          </p>
        ) : null}
      </div>
      <ContinueButton
        next={next}
        onContinue={onContinue}
        messageId={messageId}
        className="shrink-0 px-5"
        label="Continue"
      />
    </section>
  );
}
