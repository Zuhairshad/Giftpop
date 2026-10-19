"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactElement } from "react";

import { isTabKey, nextTabIndex } from "./items-copy";

interface CategoryTabsProps {
  tabs: readonly string[];
  selected: string;
  onSelect: (tab: string) => void;
  /** Prefix for element ids, so the panel can point back at its tab. */
  idPrefix: string;
}

export function tabId(idPrefix: string, index: number): string {
  return `${idPrefix}-tab-${index}`;
}

export function panelId(idPrefix: string): string {
  return `${idPrefix}-panel`;
}

/** ARIA tabs with arrow, Home and End keys. Only the selected tab is in the tab order. */
export function CategoryTabs({
  tabs,
  selected,
  onSelect,
  idPrefix,
}: CategoryTabsProps): ReactElement {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!isTabKey(event.key)) return;
    event.preventDefault();
    const target = nextTabIndex(index, event.key, tabs.length);
    const tab = tabs[target];
    if (tab === undefined) return;
    onSelect(tab);
    refs.current[target]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Item categories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {tabs.map((tab, index) => {
        const active = tab === selected;
        return (
          <button
            key={tab}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, index)}
            aria-selected={active}
            aria-controls={panelId(idPrefix)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`min-h-11 shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors motion-reduce:transition-none ${
              active
                ? "border-pink bg-pink text-on-pink"
                : "border-border bg-surface text-foreground hover:bg-surface-soft"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
