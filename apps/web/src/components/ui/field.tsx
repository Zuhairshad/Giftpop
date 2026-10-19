import { useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type FieldA11y = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

type FieldProps = {
  label: string;
  /** Adds "(optional)" after the label. Fields are required unless marked. */
  optional?: boolean;
  hint?: string;
  error?: string | undefined;
  className?: string;
  /** Receives the id and aria attributes to spread onto the control. */
  children: (control: FieldA11y) => ReactNode;
};

/**
 * A visible label above any control, with an optional hint and an error line (icon plus text, never
 * colour alone). The control is passed in as a render function and gets the id and aria attributes.
 */
export function Field({ label, optional, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ink text-sm font-semibold">
        {label}
        {optional ? <span className="text-ink-2 font-normal"> (optional)</span> : null}
      </label>
      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-ink-2 text-[13px]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-danger flex items-start gap-1.5 text-[13px] font-medium"
        >
          <svg
            viewBox="0 0 16 16"
            className="mt-px size-4 flex-none"
            aria-hidden="true"
            fill="none"
          >
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8" cy="11" r="1" fill="currentColor" />
          </svg>
          <span className="wrap-anywhere">{error}</span>
        </p>
      ) : null}
    </div>
  );
}
