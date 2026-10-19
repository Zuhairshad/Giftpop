"use client";

import { toColorInputValue } from "../lib/colour";

import { Input } from "@/components/ui/input";


interface ColourInputProps {
  id: string;
  value: string;
  onChange: (hex: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string | undefined;
  /** Label for the colour picker button, which has no visible text of its own. */
  pickerLabel: string;
}

/** A hex text field with a native colour picker beside it. */
export function ColourInput({
  id,
  value,
  onChange,
  onBlur,
  invalid = false,
  describedBy,
  pickerLabel,
}: ColourInputProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label={pickerLabel}
        value={toColorInputValue(value)}
        onChange={(event) => onChange(event.target.value)}
        className="focus-visible:ring-ring/50 border-input h-8 w-10 shrink-0 cursor-pointer rounded-lg border bg-transparent p-0.5 outline-none focus-visible:ring-3"
      />
      <Input
        id={id}
        value={value}
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="font-mono"
      />
    </div>
  );
}
