"use client";

import type { ColourOption, HexColor } from "@giftpop/contracts";
import { useId, useRef } from "react";
import type { KeyboardEvent, ReactElement } from "react";

import { nextSwatchIndex, readableInk, sameColour } from "./colours";

interface SwatchGroupProps {
  /** "Wrapper" or "Ribbon". Also names the radiogroup. */
  label: string;
  options: readonly ColourOption[];
  value: HexColor | null;
  onChange: (hex: HexColor) => void;
}

/**
 * One radiogroup of colour swatches. Each swatch is a 44px button named after its palette colour
 * ("Blush pink"). Arrow keys move the choice; only the chosen swatch is in the tab order.
 */
export function SwatchGroup({ label, options, value, onChange }: SwatchGroupProps): ReactElement {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => sameColour(option.hex, value));
  const selectedName = options[selectedIndex]?.name;
  // With no match (a colour no longer in the palette), the first swatch takes the tab stop.
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = nextSwatchIndex(index, event.key, options.length);
    if (target === null) return;
    event.preventDefault();
    const option = options[target];
    if (!option) return;
    onChange(option.hex);
    refs.current[target]?.focus();
  };

  return (
    <div>
      <h3 id={labelId} className="text-foreground text-base font-semibold">
        {label}
        {selectedName ? (
          <span className="text-muted ml-2 text-sm font-medium wrap-anywhere">{selectedName}</span>
        ) : null}
      </h3>
      <div role="radiogroup" aria-labelledby={labelId} className="mt-2 flex flex-wrap gap-2">
        {options.map((option, index) => {
          const checked = index === selectedIndex;
          return (
            <button
              key={option.hex}
              ref={(node) => {
                refs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.name}
              title={option.name}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={() => onChange(option.hex)}
              onKeyDown={(event) => onKeyDown(event, index)}
              style={{ backgroundColor: option.hex, color: readableInk(option.hex) }}
              className={`shadow-hairline grid size-11 place-items-center rounded-full transition-transform motion-reduce:transition-none ${
                checked
                  ? "ring-foreground ring-offset-surface ring-2 ring-offset-2"
                  : "hover:scale-105"
              }`}
            >
              {checked ? (
                <svg
                  viewBox="0 0 16 16"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  focusable="false"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M3 8.5l3.2 3L13 4.5"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
