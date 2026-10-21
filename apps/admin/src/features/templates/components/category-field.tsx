"use client";

import type { TemplateCategory } from "@giftpop/contracts";
import { useId, useState } from "react";

import { EXAMPLE_CATEGORY_NAMES, resolveNewCategory } from "../lib/category";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/features/catalog/components/option-select";

const NONE = "__none__";
const NEW = "__new__";

interface CategoryFieldProps {
  value: TemplateCategory | null;
  /** The categories already used by templates. */
  options: readonly TemplateCategory[];
  onChange: (next: TemplateCategory | null) => void;
  error?: string | undefined;
}

/**
 * Picks an occasion from the categories already in use, none, or a new one typed by name. The slug
 * is derived from the name. Categories are data: nothing here limits what staff can type.
 */
export function CategoryField({ value, options, onChange, error }: CategoryFieldProps) {
  const base = useId();
  const [creating, setCreating] = useState(false);
  const [typed, setTyped] = useState("");

  const reading = creating ? resolveNewCategory(typed, options) : null;
  const typedError = reading?.state === "invalid" ? reading.reason : undefined;
  const shownError = typedError ?? error;
  const describedBy = [`${base}-hint`, shownError ? `${base}-error` : null]
    .filter(Boolean)
    .join(" ");

  function choose(next: string) {
    if (next === NEW) {
      setCreating(true);
      setTyped("");
      onChange(null);
      return;
    }
    setCreating(false);
    onChange(next === NONE ? null : (options.find((option) => option.slug === next) ?? null));
  }

  function type(text: string) {
    setTyped(text);
    const result = resolveNewCategory(text, options);
    if (result.state === "ready") onChange(result.category);
    // An unusable name must not save silently as "no category": hand the form an empty slug to refuse.
    else onChange(result.state === "invalid" ? { slug: "", name: text.trim() || "?" } : null);
  }

  return (
    <div className="grid grid-cols-1 content-start gap-1.5">
      <Label htmlFor={`${base}-select`}>Category</Label>
      <OptionSelect
        id={`${base}-select`}
        value={creating ? NEW : (value?.slug ?? NONE)}
        options={[
          { value: NONE, label: "No category" },
          ...options.map((option) => ({ value: option.slug, label: option.name })),
          { value: NEW, label: "New category…" },
        ]}
        onValueChange={choose}
        invalid={Boolean(shownError)}
        describedBy={describedBy}
        className="w-full sm:w-64"
      />
      {creating ? (
        <div className="grid grid-cols-1 gap-1.5">
          <Label htmlFor={`${base}-name`}>New category name</Label>
          <Input
            id={`${base}-name`}
            value={typed}
            maxLength={40}
            autoComplete="off"
            aria-invalid={Boolean(typedError)}
            aria-describedby={describedBy}
            className="sm:w-64"
            onChange={(event) => type(event.target.value)}
          />
          {reading?.state === "ready" ? (
            <p role="status" className="text-muted-foreground text-xs">
              {reading.reused
                ? `This is the existing category “${reading.category.name}”.`
                : `Customers will see the filter “${reading.category.name}”, with the link name ${reading.category.slug}.`}
            </p>
          ) : null}
        </div>
      ) : null}
      <p id={`${base}-hint`} className="text-muted-foreground text-xs">
        The occasion customers filter by, for example {EXAMPLE_CATEGORY_NAMES.join(", ")}. Any name
        works.
      </p>
      {shownError ? (
        <p id={`${base}-error`} role="alert" className="text-destructive text-sm">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
