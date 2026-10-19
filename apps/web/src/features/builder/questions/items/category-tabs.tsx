"use client";

import { useRef } from "react";
import type { KeyboardEvent, ReactElement } from "react";

import { isTabKey, nextTabIndex } from "./items-copy";
import { EDGE_FADE_CLASS, useEdgeFade } from "./use-edge-fade";

import { PillTab } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface CategoryTab {
  label: string;
  /** Items of this category already picked; shown as a badge when above 0. */
  picked: number;
}

interface CategoryTabsProps {
  tabs: readonly CategoryTab[];
  selected: string;
  onSelect: (label: string) => void;
  /** Prefix for element ids, so the panel can point back at its tab. */
  idPrefix: string;
}

export function tabId(idPrefix: string, index: number): string {
  return `${idPrefix}-tab-${index}`;
}

export function panelId(idPrefix: string): string {
  return `${idPrefix}-panel`;
}

/**
 * ARIA tabs in one scrolling row that fades at its edge, with arrow, Home and End keys.
 * Only the selected tab is in the tab order.
 */
export function CategoryTabs({
  tabs,
  selected,
  onSelect,
  idPrefix,
}: CategoryTabsProps): ReactElement {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const { ref, fade, onScroll } = useEdgeFade<HTMLDivElement>();

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!isTabKey(event.key)) return;
    event.preventDefault();
    const target = nextTabIndex(index, event.key, tabs.length);
    const tab = tabs[target];
    if (tab === undefined) return;
    onSelect(tab.label);
    buttons.current[target]?.focus();
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      role="tablist"
      aria-label="Item categories"
      className={cn(
        "flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 [scrollbar-width:none]",
        fade && EDGE_FADE_CLASS,
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.label === selected;
        return (
          <PillTab
            key={tab.label}
            ref={(node: HTMLButtonElement | null) => {
              buttons.current[index] = node;
            }}
            id={tabId(idPrefix, index)}
            selected={active}
            aria-controls={panelId(idPrefix)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(tab.label)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="snap-start"
          >
            {tab.label}
            {tab.picked > 0 ? (
              <span
                className={cn(
                  "inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold",
                  active ? "bg-background text-foreground" : "bg-pink-soft text-pink-strong",
                )}
              >
                {tab.picked}
              </span>
            ) : null}
          </PillTab>
        );
      })}
    </div>
  );
}
