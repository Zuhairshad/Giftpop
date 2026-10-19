"use client";

import type { PricedItem } from "@giftpop/contracts";
import { useId, useRef } from "react";
import type { ReactElement } from "react";

import { ItemArt } from "@/features/builder/questions/items/item-art";
import {
  addControlState,
  addLabel,
  quantityLabel,
  stepperAddLabel,
  stepperRemoveLabel,
} from "@/features/builder/questions/items/items-copy";
import { priceLabel } from "@/features/builder/questions/price-label";

interface ItemCardProps {
  entry: PricedItem;
  currency: string;
  qty: number;
  /** From the store's `addBlockedReason`: why one more cannot be added, or null. */
  blockedReason: string | null;
  onAdd: () => void;
  onRemove: () => void;
}

const STEP_BUTTON =
  "grid size-11 place-items-center rounded-full border-2 text-xl font-bold leading-none transition-colors motion-reduce:transition-none";

export function ItemCard({
  entry,
  currency,
  qty,
  blockedReason,
  onAdd,
  onRemove,
}: ItemCardProps): ReactElement {
  const { item } = entry;
  const reasonId = useId();
  const pickRef = useRef<HTMLButtonElement>(null);
  const control = addControlState(blockedReason, qty);
  const price = priceLabel(entry.priceMinor, currency);

  const add = () => {
    if (control.canAdd) onAdd();
  };
  const remove = () => {
    // The stepper disappears when the last one goes, so keep keyboard focus on the card.
    if (qty === 1) pickRef.current?.focus();
    onRemove();
  };

  const border = qty > 0 ? "border-pink ring-4 ring-pink-soft" : "border-border";

  return (
    <li className="flex">
      <div
        className={`bg-surface rounded-card relative flex w-full flex-col border-2 transition motion-reduce:transition-none ${border} ${
          control.cardDisabled ? "opacity-70" : ""
        }`}
      >
        <button
          ref={pickRef}
          type="button"
          aria-disabled={!control.canAdd}
          aria-describedby={control.reason ? reasonId : undefined}
          aria-label={`${addLabel(item.name, qty)} ${price}`}
          onClick={add}
          className={`rounded-card flex flex-1 flex-col items-center gap-1 p-3 text-center ${
            control.canAdd ? "hover:bg-surface-soft cursor-pointer" : "cursor-not-allowed"
          }`}
        >
          <span aria-hidden="true" className="block aspect-square w-full max-w-28">
            <ItemArt item={item} />
          </span>
          <span aria-hidden="true" className="text-foreground text-sm leading-tight font-semibold">
            {item.name}
          </span>
          {/* A real space, so the visible text reads "Rose PKR 840.00" like the accessible name. */}{" "}
          <span aria-hidden="true" className="text-pink-strong text-sm font-bold">
            {price}
          </span>
        </button>

        {control.reason ? (
          <p
            id={reasonId}
            className="bg-surface-soft text-muted mx-3 mb-3 rounded-full px-3 py-1 text-center text-xs font-bold"
          >
            {control.reason}
          </p>
        ) : null}

        {qty > 0 ? (
          <div
            role="group"
            aria-label={quantityLabel(item.name, qty)}
            className="mx-3 mb-3 flex items-center justify-between gap-2"
          >
            <button
              type="button"
              aria-label={stepperRemoveLabel(item.name)}
              onClick={remove}
              className={`${STEP_BUTTON} border-border bg-surface text-foreground hover:bg-surface-soft`}
            >
              <span aria-hidden="true">&minus;</span>
            </button>
            <span
              aria-hidden="true"
              className="text-foreground min-w-6 text-center text-lg font-bold"
            >
              {qty}
            </span>
            <button
              type="button"
              aria-disabled={!control.canAdd}
              aria-label={stepperAddLabel(item.name)}
              onClick={add}
              className={`${STEP_BUTTON} ${
                control.canAdd
                  ? "border-pink bg-pink text-on-pink hover:bg-pink-strong"
                  : "border-border bg-surface-soft text-muted cursor-not-allowed"
              }`}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
