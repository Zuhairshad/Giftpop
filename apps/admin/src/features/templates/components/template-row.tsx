"use client";

import type { FeaturedTemplate, TemplateCategory } from "@giftpop/contracts";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { useId } from "react";

import { findPublicTemplate, priceLine } from "../lib/price-line";
import type { CountryPrice } from "../lib/price-line";
import type { MoveDirection } from "../lib/reorder";

import type { PublicList } from "./use-country-prices";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionSelect } from "@/features/catalog/components/option-select";

const NO_CATEGORY = "__none__";

interface TemplateRowProps {
  template: FeaturedTemplate;
  isFirst: boolean;
  isLast: boolean;
  /** True while a change to this row is being saved. */
  busy: boolean;
  categories: readonly TemplateCategory[];
  lists: ReadonlyMap<string, PublicList>;
  countryName: (code: string) => string;
  onMove: (direction: MoveDirection) => void;
  onActiveChange: (active: boolean) => void;
  onCategoryChange: (category: TemplateCategory | null) => void;
  onPreview: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function priceFor(template: FeaturedTemplate, list: PublicList | undefined): CountryPrice {
  if (!list || list.state === "loading") return { state: "loading" };
  if (list.state === "error") return { state: "error", message: list.message };
  return { state: "ready", shown: findPublicTemplate(list.templates, template.id) };
}

const TONE_CLASS = {
  price: "text-foreground",
  hidden: "text-muted-foreground",
  error: "text-destructive",
  loading: "text-muted-foreground",
} as const;

export function TemplateRow({
  template,
  isFirst,
  isLast,
  busy,
  categories,
  lists,
  countryName,
  onMove,
  onActiveChange,
  onCategoryChange,
  onPreview,
  onEdit,
  onRemove,
}: TemplateRowProps) {
  const base = useId();
  const categoryOptions = [
    { value: NO_CATEGORY, label: "No category" },
    ...categories.map((category) => ({ value: category.slug, label: category.name })),
  ];

  return (
    <li className="flex gap-3 rounded-lg border p-4">
      <div
        className="flex shrink-0 flex-col gap-1"
        role="group"
        aria-label={`Order of ${template.title}`}
      >
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Move ${template.title} up`}
          disabled={isFirst || busy}
          onClick={() => onMove("up")}
        >
          <ArrowUpIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Move ${template.title} down`}
          disabled={isLast || busy}
          onClick={() => onMove("down")}
        >
          <ArrowDownIcon />
        </Button>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium wrap-anywhere">{template.title}</p>
            {template.featured ? (
              <Badge>
                <StarIcon data-icon="inline-start" />
                Featured
              </Badge>
            ) : null}
            {template.category ? <Badge variant="outline">{template.category.name}</Badge> : null}
          </div>
          {template.description ? (
            <p className="text-muted-foreground text-sm wrap-anywhere">{template.description}</p>
          ) : null}
          <ul className="grid grid-cols-1 gap-0.5 text-sm" aria-label="Price in each country">
            {template.countries.map((code) => {
              const line = priceLine({
                countryCode: code,
                countryName: countryName(code),
                templateActive: template.active,
                price: priceFor(template, lists.get(code)),
              });
              return (
                <li key={code} className={`${TONE_CLASS[line.tone]} wrap-anywhere`}>
                  {line.text}
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground text-xs">Sort order {template.sortOrder}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 lg:justify-end">
          <div className="grid gap-1">
            <Label htmlFor={`${base}-category`} className="text-xs">
              Category
            </Label>
            <OptionSelect
              id={`${base}-category`}
              value={template.category?.slug ?? NO_CATEGORY}
              options={categoryOptions}
              disabled={busy}
              className="w-40"
              onValueChange={(next) =>
                onCategoryChange(
                  next === NO_CATEGORY
                    ? null
                    : (categories.find((category) => category.slug === next) ?? null),
                )
              }
            />
          </div>
          <div className="flex h-7 items-center gap-2">
            <Switch
              id={`${base}-active`}
              aria-label={`${template.active ? "Published" : "Hidden"}: ${template.title}`}
              checked={template.active}
              disabled={busy}
              onCheckedChange={onActiveChange}
            />
            <Label htmlFor={`${base}-active`}>{template.active ? "Published" : "Hidden"}</Label>
          </div>
          <Button variant="outline" size="sm" onClick={onPreview}>
            <EyeIcon data-icon="inline-start" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onRemove}>
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
