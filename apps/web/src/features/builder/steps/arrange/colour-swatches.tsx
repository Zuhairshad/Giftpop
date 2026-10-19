"use client";

import type { ColourOption, HexColor } from "@giftpop/contracts";
import { useId } from "react";

import { readableInk, sameColour } from "@/features/builder/questions/colours/colours";

interface ColourSwatchesProps {
  legend: string;
  options: readonly ColourOption[];
  value: HexColor | null;
  onChange: (hex: HexColor) => void;
}

/**
 * One group of colour choices. Native radio inputs give arrow-key movement and a single tab stop.
 * The selected swatch has a tick and a thick ring, and every swatch shows its colour name.
 */
export function ColourSwatches({ legend, options, value, onChange }: ColourSwatchesProps) {
  const name = useId();
  const selectedName = options.find((option) => sameColour(option.hex, value))?.name;

  return (
    <fieldset className="min-w-0">
      <legend className="font-display text-lg font-bold">
        {legend}
        {selectedName ? (
          <span className="text-muted ml-2 text-base font-semibold">{selectedName}</span>
        ) : null}
      </legend>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-4">
        {options.map((option) => {
          const checked = sameColour(option.hex, value);
          return (
            <label
              key={option.hex}
              className="group flex w-16 cursor-pointer flex-col items-center gap-1.5 text-center"
            >
              <input
                type="radio"
                name={name}
                value={option.hex}
                checked={checked}
                onChange={() => onChange(option.hex)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                style={{ backgroundColor: option.hex, color: readableInk(option.hex) }}
                className="border-border ring-offset-background peer-checked:ring-foreground peer-focus-visible:outline-[var(--gp-focus)] flex size-12 items-center justify-center rounded-full border shadow-sm ring-offset-2 transition-transform group-hover:scale-105 peer-checked:ring-4 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 motion-reduce:transition-none"
              >
                {checked ? (
                  <svg viewBox="0 0 20 20" className="size-6" fill="none" stroke="currentColor">
                    <path d="M4 10.5l4 4 8-9" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : null}
              </span>
              <span
                className={`text-xs leading-tight ${checked ? "text-foreground font-bold" : "text-muted font-semibold"}`}
              >
                {option.name}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
