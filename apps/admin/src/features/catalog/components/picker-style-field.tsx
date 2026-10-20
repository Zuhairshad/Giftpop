"use client";

import type { ItemPickerStyle } from "@giftpop/contracts";
import { useId } from "react";

import { PICKER_STYLE_OPTIONS, parsePickerStyle, resolvePickerStyle } from "../lib/item-labels";

interface PickerStyleFieldProps {
  value: ItemPickerStyle | undefined;
  onChange: (style: ItemPickerStyle) => void;
  error?: string | undefined;
  className?: string;
}

/** How the builder offers the item: a picture tile in the grid, or a line in the written list. */
export function PickerStyleField({ value, onChange, error, className }: PickerStyleFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const selected = resolvePickerStyle(value);

  return (
    <fieldset
      className={className}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 text-sm leading-none font-medium">
        How the store offers this item
      </legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PICKER_STYLE_OPTIONS.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className="has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
            >
              <input
                id={optionId}
                type="radio"
                name={`${id}-picker-style`}
                value={option.value}
                checked={selected === option.value}
                onChange={(event) => onChange(parsePickerStyle(event.target.value))}
                aria-describedby={`${optionId}-description`}
                className="accent-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <span className="grid grid-cols-1 gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span id={`${optionId}-description`} className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-destructive mt-1.5 text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
