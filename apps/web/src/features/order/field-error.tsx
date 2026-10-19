import type { ReactElement, ReactNode } from "react";

/** The error text under a field: danger colour plus an icon, so it is not colour alone. */
export function FieldError({ id, children }: { id: string; children: ReactNode }): ReactElement {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-danger">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="mt-0.5 size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4.6v4M8 11.2v.1" />
      </svg>
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </p>
  );
}
