"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useBuilder } from "../state";

import { moveAnnouncement } from "./layout/reorder";
import { ReorderList } from "./layout/reorder-list";
import type { ReorderRow } from "./layout/reorder-list";

import { Button } from "@/components/ui";

/** Question 4 body: shuffle, or move items up and down. The overview rearranges as you go. */
export function LayoutBody(): ReactElement {
  const builder = useBuilder();
  const { catalog, lines } = builder;
  const [announcement, setAnnouncement] = useState("");

  const rows = useMemo<ReorderRow[]>(() => {
    const byId = new Map(catalog.items.map((entry) => [entry.item.id, entry.item]));
    return lines.flatMap((line) => {
      const item = byId.get(line.itemId);
      return item ? [{ line, item }] : [];
    });
  }, [lines, catalog.items]);

  const move = (from: number, to: number) => {
    const name = rows[from]?.item.name ?? "Item";
    builder.moveItem(from, to);
    setAnnouncement(moveAnnouncement(name, to, rows.length));
  };

  const shuffle = () => {
    builder.shuffle();
    // The invisible suffix flips so a screen reader repeats the sentence on every press.
    setAnnouncement((previous) =>
      previous.startsWith("Arrangement shuffled") && !previous.endsWith("​")
        ? "Arrangement shuffled​"
        : "Arrangement shuffled",
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted text-sm">
          Shuffle for a fresh look, or move items up and down to set the order.
        </p>
        <Button variant="tint" size="sm" onClick={shuffle} className="shrink-0">
          <svg
            viewBox="0 0 20 20"
            className="size-5"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 6h3c4 0 4 8 8 8h3m0 0l-2-2m2 2l-2 2M3 14h3c1 0 1.8-.6 2.5-1.5M17 6h-3c-1 0-1.8.6-2.5 1.5M17 6l-2-2m2 2l-2 2"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Shuffle
        </Button>
      </div>

      {rows.length > 0 ? (
        <ReorderList rows={rows} onMove={move} />
      ) : (
        <p className="bg-warm text-muted rounded-md p-4 text-center text-sm">
          You have not picked any items yet.
        </p>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
