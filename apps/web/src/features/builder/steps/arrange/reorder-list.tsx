"use client";

import type { DesignItem, Item } from "@giftpop/contracts";
import { useState } from "react";
import type { DragEvent } from "react";

import { dropTarget, stepTarget } from "./reorder";
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
  "border-border bg-surface text-foreground hover:bg-surface-soft flex size-10 items-center justify-center rounded-full border text-lg font-bold transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-surface";

function Arrow({ direction }: { direction: MoveDirection }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
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
 * The picked items in slot order. Buttons work on every device. On a mouse, rows can also be
 * dragged by the handle (native HTML5 drag events; touch screens use the buttons).
 */
export function ReorderList({ rows, onMove }: ReorderListProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function endDrag() {
    setDragFrom(null);
    setDragOver(null);
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, index: number) {
    event.preventDefault();
    const to = dropTarget(dragFrom, index, rows.length);
    if (dragFrom !== null && to !== null) onMove(dragFrom, to);
    endDrag();
  }

  function press(index: number, direction: MoveDirection) {
    const to = stepTarget(index, direction, rows.length);
    if (to !== null) onMove(index, to);
  }

  return (
    <ol className="space-y-2" aria-label="Items in slot order">
      {rows.map(({ line, item }, index) => {
        const dragging = dragFrom === index;
        const target = dragOver === index && dragFrom !== null && dragFrom !== index;
        return (
          <li
            key={item.id}
            onDragOver={(event) => {
              if (dragFrom === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dragOver !== index) setDragOver(index);
            }}
            onDrop={(event) => handleDrop(event, index)}
            className={`bg-surface flex items-center gap-3 rounded-card border-2 p-2 pr-3 transition-colors motion-reduce:transition-none ${
              target ? "border-pink bg-pink-soft" : "border-border"
            } ${dragging ? "opacity-50" : ""}`}
          >
            <span
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.name);
                setDragFrom(index);
              }}
              onDragEnd={endDrag}
              aria-hidden="true"
              title="Drag to reorder"
              className="text-muted hidden size-8 cursor-grab touch-none items-center justify-center rounded-soft select-none active:cursor-grabbing [@media(pointer:fine)]:flex"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="currentColor">
                {[6, 10, 14].flatMap((y) =>
                  [7, 13].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />),
                )}
              </svg>
            </span>

            <span
              aria-hidden="true"
              className="bg-surface-soft text-pink-strong flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
            >
              {index + 1}
            </span>
            <span
              aria-hidden="true"
              className="border-border size-6 shrink-0 rounded-full border"
              style={{ backgroundColor: item.color }}
            />

            <span className="min-w-0 flex-1">
              <span className="block leading-snug font-bold break-words" data-item-name>
                {item.name}
              </span>
              <span className="sr-only">
                Position {index + 1} of {rows.length}
              </span>
              {line.qty > 1 ? (
                <span className="text-muted block text-sm">Quantity {line.qty}</span>
              ) : null}
            </span>

            <span className="flex shrink-0 gap-1.5">
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
        );
      })}
    </ol>
  );
}
