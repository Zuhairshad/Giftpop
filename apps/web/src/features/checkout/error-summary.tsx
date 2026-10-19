import type { ReactElement } from "react";

import { summaryHeading } from "./error-summary-model";
import type { ErrorSummaryEntry } from "./error-summary-model";

/**
 * Shown at the top of the form after a failed submit, so a screen-reader user hears how many
 * fields need fixing, not only the first. It lists the errors from that submit and stays until the
 * next one; the parent remounts it per attempt, so `role="alert"` announces it once each time.
 */
export function ErrorSummary({ entries }: { entries: ErrorSummaryEntry[] }): ReactElement | null {
  if (entries.length === 0) return null;
  return (
    <div
      role="alert"
      className="bg-surface-soft border-pink-strong rounded-soft space-y-2 border-2 p-4"
    >
      <h2 className="font-bold">{summaryHeading(entries.length)}</h2>
      <ul className="list-disc space-y-1 ps-5">
        {entries.map((entry) => (
          <li key={entry.field}>
            <a
              href={entry.href}
              className="text-pink-strong font-semibold underline underline-offset-4"
            >
              {entry.label ? `${entry.label}: ${entry.message}` : entry.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
