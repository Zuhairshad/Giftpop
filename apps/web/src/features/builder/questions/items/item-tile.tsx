"use client";

import type { PricedItem } from "@giftpop/contracts";
import { useId, useRef } from "react";
import type { ReactElement } from "react";

import { priceLabel } from "../price-label";

import { ItemArt } from "./item-art";
import {
  addControlState,
  addLabel,
  quantityLabel,
  stepperAddLabel,
  stepperRemoveLabel,
} from "./items-copy";

import { cn } from "@/lib/cn";

interface ItemTileProps {
  entry: PricedItem;
  currency: string;
  qty: number;
  /** From the store's `addBlockedReason`: why one more cannot be added, or null. */
  blockedReason: string | null;
  onAdd: () => void;
  onRemove: () => void;
}

const STEP_BUTTON =
  "grid size-11 place-items-center rounded-full text-xl leading-none font-bold transition-colors motion-reduce:transition-none";

/**
 * One item. Pressing the tile adds one. Once picked it has a 2px primary ring, a count badge and
 * a minus / plus pair. An item that cannot be added stays visible: only its art and name dim,
 * and a one-line reason ("Out of stock", "Box is full") stays at full strength. A picked item
 * that cannot take one more prints no reason; its "+" just looks (and is) off.
 */
export function ItemTile({
  entry,
  currency,
  qty,
  blockedReason,
  onAdd,
  onRemove,
}: ItemTileProps): ReactElement {
  const { item } = entry;
  const reasonId = useId();
  const pickRef = useRef<HTMLButtonElement>(null);
  const control = addControlState(blockedReason, qty);
  const price = priceLabel(entry.priceMinor, currency);
  const dim = control.cardDisabled ? "opacity-50" : "";

  const add = () => {
    if (control.canAdd) onAdd();
  };
  const remove = () => {
    // The stepper disappears when the last one goes, so keep keyboard focus on the tile.
    if (qty === 1) pickRef.current?.focus();
    onRemove();
  };

  return (
    // Keyboard focus scrolls a tile clear of the sticky tabs and counter (desktop grid).
    <li className="flex snap-start min-[900px]:scroll-mt-28">
      <div
        className={cn(
          "bg-surface rounded-md relative flex w-full min-w-0 flex-col items-center gap-0.5 p-1.5 shadow-hairline",
          qty > 0 && "ring-pink ring-2",
        )}
      >
        <button
          ref={pickRef}
          type="button"
          aria-disabled={!control.canAdd}
          aria-describedby={control.reason ? reasonId : undefined}
          aria-label={`${addLabel(item.name, qty)} ${price}`}
          onClick={add}
          className={cn(
            "rounded-sm flex w-full min-w-0 flex-col items-center gap-0.5 text-center",
            control.canAdd ? "cursor-pointer" : "cursor-not-allowed",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("bg-warm rounded-sm grid w-full place-items-center py-1", dim)}
          >
            <span className="block size-14 min-[900px]:size-20">
              <ItemArt item={item} />
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "text-foreground mt-1 w-full text-xs leading-tight font-medium wrap-anywhere min-[900px]:text-[13px]",
              dim,
            )}
          >
            {item.name}
          </span>
          {control.reasonShown ? null : (
            <span aria-hidden="true" className="text-muted text-xs leading-tight">
              {price}
            </span>
          )}
        </button>

        {control.reason ? (
          // Printed only on an unpicked card; a picked card keeps it for screen readers only.
          <p
            id={reasonId}
            className={
              control.reasonShown
                ? "text-warning w-full text-xs leading-tight font-semibold wrap-anywhere"
                : "sr-only"
            }
          >
            {control.reason}
          </p>
        ) : null}

        {qty > 0 ? (
          <span
            aria-hidden="true"
            className="bg-pink text-on-pink pointer-events-none absolute top-1.5 right-1.5 rounded-full px-2 py-1 text-xs leading-none font-bold"
          >
            &times; {qty}
          </span>
        ) : null}

        {qty > 0 ? (
          <div role="group" aria-label={quantityLabel(item.name, qty)} className="flex gap-1">
            <button
              type="button"
              aria-label={stepperRemoveLabel(item.name)}
              onClick={remove}
              className={`${STEP_BUTTON} bg-warm text-foreground hover:bg-warm-deep shadow-hairline`}
            >
              <span aria-hidden="true">&minus;</span>
            </button>
            <button
              type="button"
              aria-disabled={!control.canAdd}
              aria-describedby={control.reason ? reasonId : undefined}
              aria-label={stepperAddLabel(item.name)}
              onClick={add}
              className={cn(
                STEP_BUTTON,
                control.canAdd
                  ? "bg-pink text-on-pink hover:bg-pink-strong"
                  : // Full: plainly off, a faint outline with no fill, while "−" stays solid.
                    "text-muted/60 cursor-not-allowed border border-dashed border-border-strong bg-transparent",
              )}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
