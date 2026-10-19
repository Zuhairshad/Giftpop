"use client";

import { useId } from "react";

import { toggleCountry } from "../lib/countries";
import type { CountryChoice } from "../lib/countries";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CountryCheckboxesProps {
  choices: readonly CountryChoice[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  error?: string | undefined;
}

/** A multi-select of countries as labelled checkboxes. */
export function CountryCheckboxes({ choices, value, onChange, error }: CountryCheckboxesProps) {
  const base = useId();
  const errorId = `${base}-error`;
  const order = choices.map((choice) => choice.code);
  return (
    <fieldset className="grid grid-cols-1 gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="text-sm leading-none font-medium">Countries</legend>
      {choices.length === 0 ? (
        <p className="text-muted-foreground text-sm">No live countries yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {choices.map((choice) => {
            const id = `${base}-${choice.code}`;
            const checked = value.includes(choice.code);
            return (
              <div key={choice.code} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  disabled={!choice.live && !checked}
                  aria-invalid={Boolean(error)}
                  onCheckedChange={(next) =>
                    onChange(toggleCountry(value, choice.code, next === true, order))
                  }
                />
                <Label htmlFor={id} className="wrap-anywhere">
                  {choice.name}
                  {choice.live ? null : (
                    <span className="text-muted-foreground font-normal"> (not live)</span>
                  )}
                </Label>
              </div>
            );
          })}
        </div>
      )}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
