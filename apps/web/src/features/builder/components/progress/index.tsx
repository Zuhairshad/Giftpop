"use client";

import type { CountryCode } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { stepHref, useBuilder } from "../../state";
import type { BuilderStep } from "../../state";

import { backTarget, progressEntries, progressSummary, statusHint } from "./progress-model";
import type { ProgressEntry } from "./progress-model";

const CIRCLE =
  "grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors";

function StepCircle({ entry }: { entry: ProgressEntry }): ReactElement {
  const style =
    entry.status === "current"
      ? "border-pink bg-pink text-on-pink"
      : entry.status === "done"
        ? "border-pink bg-pink-soft text-pink-strong"
        : "border-border bg-surface text-muted";
  return (
    <span aria-hidden="true" className={`${CIRCLE} ${style}`}>
      {entry.status === "done" ? "✓" : entry.position}
    </span>
  );
}

function StepLabel({ entry }: { entry: ProgressEntry }): ReactElement {
  // Labels stay in the accessibility tree on small screens; only the other steps shrink to a number.
  const visible = entry.status === "current" ? "" : "sr-only sm:not-sr-only";
  return (
    <>
      <span className={`${visible} text-sm font-semibold`}>{entry.label}</span>
      <span className="sr-only">, {statusHint(entry.status)}</span>
    </>
  );
}

function StepItem({ entry, href }: { entry: ProgressEntry; href: string }): ReactElement {
  const body = (
    <>
      <StepCircle entry={entry} />
      <StepLabel entry={entry} />
    </>
  );
  const base = "flex min-h-11 items-center gap-2 rounded-full pe-1";
  if (entry.status === "done") {
    return (
      <Link href={href} className={`${base} text-pink-strong hover:bg-surface-soft`}>
        {body}
      </Link>
    );
  }
  return (
    <span
      aria-current={entry.status === "current" ? "step" : undefined}
      className={`${base} ${entry.status === "current" ? "text-foreground" : "text-muted"}`}
    >
      {body}
    </span>
  );
}

/** Presentational progress bar: needs the country only to build links to earlier steps. */
export function StepProgressView({
  current,
  country,
}: {
  current: BuilderStep;
  country: CountryCode;
}): ReactElement {
  const back = backTarget(current, country);
  return (
    <div className="mb-6 space-y-1 sm:mb-8">
      <Link
        href={back.href}
        className="text-muted hover:text-foreground inline-flex min-h-11 items-center gap-1.5 rounded-full pe-3 text-sm font-semibold"
      >
        <span aria-hidden="true">&larr;</span>
        {back.label}
      </Link>
      <nav aria-label="Gift builder progress">
        <p className="text-muted text-sm font-semibold sm:hidden" aria-hidden="true">
          {progressSummary(current)}
        </p>
        <ol className="flex items-center gap-1 sm:gap-2">
          {progressEntries(current).map((entry, index) => (
            <li key={entry.step} className="flex items-center gap-1 sm:gap-2">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-3 rounded-full sm:w-8 ${
                    entry.status === "upcoming" ? "bg-border" : "bg-pink"
                  }`}
                />
              ) : null}
              <StepItem entry={entry} href={stepHref(country, entry.step)} />
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

/** Shared by all five builder steps. Reads the country from the builder store. */
export function StepProgress({ current }: { current: BuilderStep }): ReactElement {
  const { country } = useBuilder();
  return <StepProgressView current={current} country={country} />;
}
