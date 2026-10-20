"use client";

import type { DesignItem, Item } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { stepTarget } from "./reorder";
import type { MoveDirection } from "./reorder";

export interface ReorderRow {
  line: DesignItem;
  item: Item;
}

interface ReorderListProps {
  rows: readonly ReorderRow[];
  /** Called with the row's current index and where it should go. */
  onMove: (fromIndex: number, toIndex: number) => void;
}

const ARROW_BUTTON =
  "bg-warm text-foreground hover:bg-warm-deep grid size-11 place-items-center rounded-full transition-colors motion-reduce:transition-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-warm";

function Arrow({ direction }: { direction: MoveDirection }): ReactElement {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={direction === "up" ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The picked items in slot order. Each row has "Move up" and "Move down" buttons: the gift is
 * always laid out in slots by the format's layout, so there is no free dragging.
 */
export function ReorderList({ rows, onMove }: ReorderListProps): ReactElement {
  const press = (index: number, direction: MoveDirection) => {
    const to = stepTarget(index, direction, rows.length);
    if (to !== null) onMove(index, to);
  };

  return (
    <ol className="space-y-1.5" aria-label="Items in slot order">
      {rows.map(({ line, item }, index) => (
        <li
          key={item.id}
          className="bg-surface rounded-md shadow-hairline flex items-center gap-2.5 py-1 pr-1.5 pl-3"
        >
          <span
            aria-hidden="true"
            className="text-ink-2 w-5 shrink-0 text-sm font-bold tabular-nums"
          >
            {index + 1}
          </span>
          <span
            aria-hidden="true"
            // A ring that shows on white, so a near-white item (mug, card) still has a visible dot.
            className="border-border-strong size-5 shrink-0 rounded-full border"
            style={{ backgroundColor: item.color }}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-sm leading-snug font-medium wrap-anywhere">
              {item.name}
            </span>
            <span className="sr-only">
              Position {index + 1} of {rows.length}
            </span>
            {line.qty > 1 ? (
              <span className="text-muted block text-xs">Quantity {line.qty}</span>
            ) : null}
          </span>
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              className={ARROW_BUTTON}
              aria-label={`Move ${item.name} up`}
              title="Move up"
              aria-disabled={index === 0}
              onClick={() => press(index, "up")}
            >
              <Arrow direction="up" />
            </button>
            <button
              type="button"
              className={ARROW_BUTTON}
              aria-label={`Move ${item.name} down`}
              title="Move down"
              aria-disabled={index === rows.length - 1}
              onClick={() => press(index, "down")}
            >
              <Arrow direction="down" />
            </button>
          </span>
        </li>
      ))}
    </ol>
  );
}
