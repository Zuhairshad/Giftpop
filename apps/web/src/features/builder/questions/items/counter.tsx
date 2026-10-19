import type { ReactElement } from "react";

import { counterPercent, counterText, minimumMet, spacesLeftText } from "./items-copy";

import { cn } from "@/lib/cn";

interface CounterProps {
  count: number;
  minItems: number;
  maxItems: number;
}

/**
 * "8 of 6–10 picked" with a 72px progress bar, and "2 spaces left" on the right. From the
 * minimum on the text turns success-coloured with a check. A polite live region, so a screen
 * reader hears each change without being interrupted.
 */
export function Counter({ count, minItems, maxItems }: CounterProps): ReactElement {
  const met = minimumMet(count, minItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap",
          met ? "text-success" : "text-foreground",
        )}
      >
        {met ? (
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            className="shrink-0"
          >
            <path
              d="M3 8.5l3.2 3L13 4.5"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
        {counterText(count, minItems, maxItems)}
        <span
          aria-hidden="true"
          className="bg-warm-deep block h-1.5 w-[72px] overflow-hidden rounded-full max-[359px]:hidden"
        >
          <span
            className="bg-pink block h-full rounded-full transition-[width] motion-reduce:transition-none"
            style={{ width: `${counterPercent(count, maxItems)}%` }}
          />
        </span>
      </p>
      <span className="text-muted text-[13px] font-medium whitespace-nowrap">
        {spacesLeftText(count, maxItems)}
      </span>
    </div>
  );
}
