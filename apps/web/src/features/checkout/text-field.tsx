import type { HTMLInputTypeAttribute, ReactElement } from "react";

import { fieldId } from "./fields";
import type { FieldName } from "./fields";

import { FieldError } from "@/features/order/field-error";
import { FIELD_LABEL, INPUT } from "@/features/order/ui";

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
  /** Removes characters the field can never hold, as the customer types or pastes. */
  filter?: (value: string) => string;
};

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
  filter,
}: TextFieldProps): ReactElement {
  const id = fieldId(name);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={FIELD_LABEL}>
        {label}
        {required ? null : <span className="ml-2 font-normal text-muted">(optional)</span>}
      </label>
      <div className="flex min-w-0 items-stretch gap-2">
        {prefix ? (
          <span
            aria-hidden="true"
            className="flex min-h-12 shrink-0 items-center rounded-md border border-border-strong bg-warm px-3 font-semibold text-foreground tabular-nums"
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
          onChange={(event) => onChange(filter ? filter(event.target.value) : event.target.value)}
          className={INPUT}
        />
      </div>
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
