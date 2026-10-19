import type { HTMLInputTypeAttribute, ReactElement } from "react";

import { fieldId } from "./fields";
import type { FieldName } from "./fields";

type TextFieldProps = {
  name: FieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required: boolean;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
  /** A visible prefix, such as a dial code. */
  prefix?: string | null;
  hint?: string;
};

const CONTROL =
  "border-border bg-surface text-foreground placeholder:text-muted/70 min-w-0 w-full rounded-soft border-2 px-4 py-3 text-base focus-visible:border-pink aria-[invalid=true]:border-pink-strong";

/** A labelled input. The error is read out with the field and the field is marked invalid. */
export function TextField({
  name,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  prefix,
  hint,
}: TextFieldProps): ReactElement {
  const id = fieldId(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block font-bold">
        {label}
        {required ? null : (
          <span className="text-muted ml-2 text-sm font-semibold">(optional)</span>
        )}
      </label>
      <div className="flex min-w-0 items-stretch gap-2">
        {prefix ? (
          <span
            aria-hidden="true"
            className="bg-surface-soft border-border text-foreground rounded-soft flex shrink-0 items-center border-2 px-3 font-bold tabular-nums"
          >
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={CONTROL}
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-muted mt-1.5 text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-pink-strong mt-1.5 text-sm font-bold">
          {error}
        </p>
      ) : null}
    </div>
  );
}
