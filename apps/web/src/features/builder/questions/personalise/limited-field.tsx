"use client";

import { useId, useState } from "react";
import type { ReactElement } from "react";

import { clampToLimit, countState, formatCount, limitMessage } from "./limits";

interface LimitedFieldProps {
  /** The visible label and the field's whole accessible name. */
  label: string;
  value: string;
  limit: number;
  onChange: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  /** Extra help shown under the label and read with the field. */
  hint?: string;
  autoComplete?: string;
  /** Marks the field "(optional)" in its label. */
  optional?: boolean;
  /** Removes characters the field can never hold, before the limit is applied. */
  filter?: (text: string) => string;
}

const CONTROL =
  "border-border-strong bg-surface text-foreground placeholder:text-muted/70 w-full rounded-md border px-3 py-2.5 text-base wrap-anywhere";

/**
 * A text field with a hard limit and a live "12 / 40" count. Typing or pasting past the limit is
 * cut to fit and says so. The sentence under the field is a polite status region whose text only
 * changes near the limit, so it stays quiet while the customer types.
 */
export function LimitedField({
  label,
  value,
  limit,
  onChange,
  multiline = false,
  placeholder,
  hint,
  autoComplete,
  optional = false,
  filter,
}: LimitedFieldProps): ReactElement {
  const id = useId();
  const messageId = `${id}-message`;
  const hintId = `${id}-hint`;
  const [trimmed, setTrimmed] = useState(false);

  const state = countState(value.length, limit);
  const message = limitMessage(value.length, limit, trimmed);
  const warn = trimmed || state !== "ok";

  function handleChange(raw: string) {
    const next = clampToLimit(filter ? filter(raw) : raw, limit);
    setTrimmed(next.trimmed);
    onChange(next.text);
  }

  const shared = {
    id,
    value,
    placeholder,
    required: !optional,
    "aria-describedby": hint ? `${hintId} ${messageId}` : messageId,
    onBlur: () => setTrimmed(false),
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-foreground min-w-0 text-sm font-semibold wrap-anywhere">
          {label}
          {optional ? <span className="text-muted ml-2 font-normal">(optional)</span> : null}
        </label>
        <span
          className={`text-xs font-semibold whitespace-nowrap tabular-nums ${warn ? "text-warning" : "text-muted"}`}
        >
          <span className="sr-only">Characters used: </span>
          {formatCount(value.length, limit)}
        </span>
      </div>
      {hint ? (
        <p id={hintId} className="text-muted mb-1.5 text-xs wrap-anywhere">
          {hint}
        </p>
      ) : null}
      {multiline ? (
        <textarea
          {...shared}
          rows={3}
          onChange={(event) => handleChange(event.target.value)}
          className={`${CONTROL} resize-y`}
        />
      ) : (
        <input
          {...shared}
          type="text"
          autoComplete={autoComplete ?? "off"}
          onChange={(event) => handleChange(event.target.value)}
          className={`${CONTROL} min-h-12`}
        />
      )}
      <p
        id={messageId}
        role="status"
        className={`mt-1 text-xs ${warn ? "text-warning font-semibold" : "text-muted"}`}
      >
        {message}
      </p>
    </div>
  );
}
