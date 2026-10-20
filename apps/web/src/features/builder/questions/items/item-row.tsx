"use client";

import type { PricedItem } from "@giftpop/contracts";
import { useId, useRef } from "react";
import type { ReactElement } from "react";

import { priceLabel } from "../price-label";

import {
  addControlState,
  addLabel,
  quantityLabel,
  stepperAddLabel,
  stepperRemoveLabel,
} from "./items-copy";

import { cn } from "@/lib/cn";

interface ItemRowProps {
  entry: PricedItem;
  currency: string;
  qty: number;
  /** From the store's `addBlockedReason`: why one more cannot be added, or null. */
  blockedReason: string | null;
  onAdd: () => void;
  onRemove: () => void;
}

const ROUND_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-xl leading-none font-bold transition-colors motion-reduce:transition-none";
const OFF =
  "text-muted/60 cursor-not-allowed border border-dashed border-border-strong bg-transparent";

/**
 * One written item: name, price, a reason when it cannot be added, and an "Add" button that
 * turns into a minus / count / plus stepper once picked. Same rules and accessible names as a
 * tile (see `ItemTile`), without the picture.
 */
export function ItemRow({
  entry,
  currency,
  qty,
  blockedReason,
  onAdd,
  onRemove,
}: ItemRowProps): ReactElement {
  const { item } = entry;
  const reasonId = useId();
  const addRef = useRef<HTMLButtonElement>(null);
  const control = addControlState(blockedReason, qty);
  const price = priceLabel(entry.priceMinor, currency);
  const describedBy = control.reason ? reasonId : undefined;

  const add = () => {
    if (control.canAdd) onAdd();
  };
  const remove = () => {
    onRemove();
    // The stepper goes when the last one does; put focus on the "Add" button that replaces it.
    if (qty === 1) requestAnimationFrame(() => addRef.current?.focus());
  };

  return (
    <li
      className={cn(
        "bg-surface rounded-md flex min-h-14 items-center gap-3 py-1.5 pr-1.5 pl-3 shadow-hairline min-[900px]:scroll-mt-28",
        qty > 0 && "ring-pink ring-2",
      )}
    >
      <div className={cn("min-w-0 flex-1", control.cardDisabled && "opacity-50")}>
        <p className="text-foreground text-sm leading-tight font-medium wrap-anywhere">
          {item.name}
        </p>
        <p className="text-muted mt-0.5 text-xs leading-tight">{price}</p>
      </div>

      {control.reason ? (
        <p
          id={reasonId}
          className={
            control.reasonShown
              ? "text-warning max-w-[40%] text-right text-xs leading-tight font-semibold wrap-anywhere"
              : "sr-only"
          }
        >
          {control.reason}
        </p>
      ) : null}

      {qty > 0 ? (
        <div
          role="group"
          aria-label={quantityLabel(item.name, qty)}
          className="flex shrink-0 items-center gap-1"
        >
          <button
            type="button"
            aria-label={stepperRemoveLabel(item.name)}
            onClick={remove}
            className={`${ROUND_BUTTON} bg-warm text-foreground hover:bg-warm-deep shadow-hairline`}
          >
            <span aria-hidden="true">&minus;</span>
          </button>
          <span
            aria-hidden="true"
            className="text-foreground min-w-6 text-center text-sm font-bold tabular-nums"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-disabled={!control.canAdd}
            aria-describedby={describedBy}
            aria-label={stepperAddLabel(item.name)}
            onClick={add}
            className={cn(
              ROUND_BUTTON,
              control.canAdd ? "bg-pink text-on-pink hover:bg-pink-strong" : OFF,
            )}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      ) : (
        <button
          ref={addRef}
          type="button"
          aria-disabled={!control.canAdd}
          aria-describedby={describedBy}
          // Starts with the visible word "Add" (label in name), then matches the tile's name.
          aria-label={`${addLabel(item.name, qty)} ${price}`}
          onClick={add}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-colors motion-reduce:transition-none",
            control.canAdd
              ? "bg-primary-tint text-primary-pressed hover:bg-pink hover:text-on-pink"
              : OFF,
          )}
        >
          <span aria-hidden="true">+</span>
          Add
        </button>
      )}
    </li>
  );
}
