"use client";

import { useId, useState } from "react";

import { clampToLimit, countState, formatCount, limitMessage } from "./limits";

interface LimitedFieldProps {
  label: string;
  value: string;
  limit: number;
  onChange: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

const CONTROL =
  "border-border bg-surface text-foreground placeholder:text-muted/70 w-full rounded-soft border-2 px-4 py-3 text-base focus-visible:border-pink";

/**
 * A text field with a hard limit, a live "12 / 40" count and a plain sentence about the limit.
 * Typing or pasting past the limit is cut to fit and says so. The sentence is a polite status
 * region whose text only changes near the limit, so it stays quiet while the customer types.
 */
export function LimitedField({
  label,
  value,
  limit,
  onChange,
  multiline = false,
  placeholder,
  autoComplete,
}: LimitedFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const [trimmed, setTrimmed] = useState(false);

  const state = countState(value.length, limit);
  const message = limitMessage(value.length, limit, trimmed);
  const warn = trimmed || state !== "ok";

  function handleChange(raw: string) {
    const next = clampToLimit(raw, limit);
    setTrimmed(next.trimmed);
    onChange(next.text);
  }

  const shared = {
    id,
    value,
    placeholder,
    "aria-describedby": messageId,
    onBlur: () => setTrimmed(false),
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-bold">
          {label} <span className="text-muted text-sm font-semibold">(optional)</span>
        </label>
        <span
          className={`text-sm font-bold tabular-nums ${warn ? "text-pink-strong" : "text-muted"}`}
        >
          <span className="sr-only">Characters used: </span>
          {formatCount(value.length, limit)}
        </span>
      </div>
      {multiline ? (
        <textarea
          {...shared}
          rows={5}
          onChange={(event) => handleChange(event.target.value)}
          className={`${CONTROL} resize-y`}
        />
      ) : (
        <input
          {...shared}
          type="text"
          autoComplete={autoComplete ?? "off"}
          onChange={(event) => handleChange(event.target.value)}
          className={CONTROL}
        />
      )}
      <p
        id={messageId}
        role="status"
        className={`mt-1.5 text-sm ${warn ? "text-pink-strong font-semibold" : "text-muted"}`}
      >
        {message}
      </p>
    </div>
  );
}
