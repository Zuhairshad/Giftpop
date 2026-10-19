"use client";

import { useState } from "react";

import { inputToMinor, minorToInput } from "../lib/country-form";

import { Input } from "@/components/ui/input";

interface MoneyInputProps {
  id: string;
  /** Integer minor units. `undefined` is empty and `NaN` is text that is not an amount. */
  value: number | undefined;
  onChange: (minor: number | undefined) => void;
  onBlur?: () => void;
  /** ISO currency code shown beside the field. */
  currency: string;
  invalid?: boolean;
  describedBy?: string | undefined;
  disabled?: boolean;
}

/**
 * Staff type major units ("12.50"); the form holds integer minor units (1250).
 * The text stays as typed while editing, and tidies to two decimals on blur.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  currency,
  invalid = false,
  describedBy,
  disabled = false,
}: MoneyInputProps) {
  const [text, setText] = useState(() => minorToInput(value));
  const notAnAmount = text.trim() !== "" && Number.isNaN(inputToMinor(text));

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        disabled={disabled}
        aria-invalid={invalid || notAnAmount}
        aria-describedby={describedBy}
        onChange={(event) => {
          setText(event.target.value);
          onChange(inputToMinor(event.target.value));
        }}
        onBlur={() => {
          const minor = inputToMinor(text);
          if (minor !== undefined && !Number.isNaN(minor)) setText(minorToInput(minor));
          onBlur?.();
        }}
      />
      <span className="text-muted-foreground text-sm tabular-nums" aria-hidden="true">
        {currency}
      </span>
    </div>
  );
}

/** Message for text that is not an amount, so the field can show it before the schema does. */
export function moneyTextProblem(value: number | undefined): string | undefined {
  return value !== undefined && Number.isNaN(value) ? "Enter an amount like 12.50." : undefined;
}
