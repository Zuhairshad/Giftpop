import type { DesignItem, DesignProblem, DesignProblemCode, PricedItem } from "@giftpop/contracts";

export const ALL_CATEGORY = "All";

/** "4 of 6–10 picked" (en dash), or "4 of 6 picked" when the format takes a fixed number. */
export function counterText(count: number, minItems: number, maxItems: number): string {
  const range = minItems === maxItems ? `${minItems}` : `${minItems}–${maxItems}`;
  return `${count} of ${range} picked`;
}

/**
 * Tab labels: "All" first, then the catalog's categories in order. A category that has no
 * items is left out so no tab opens an empty list; one that only appears on items is added.
 */
export function categoryTabs(
  categories: readonly string[],
  items: readonly PricedItem[],
): string[] {
  const used = new Set(items.map((entry) => entry.item.category));
  const ordered = [...new Set(categories)].filter((category) => used.has(category));
  const extra = [...used].filter((category) => !ordered.includes(category));
  return [ALL_CATEGORY, ...ordered, ...extra];
}

/** Items for one tab. "All" keeps every item. Categories are matched exactly, as stored. */
export function filterItemsByCategory(
  items: readonly PricedItem[],
  category: string,
): PricedItem[] {
  if (category === ALL_CATEGORY) return [...items];
  return items.filter((entry) => entry.item.category === category);
}

/** How many of one item are in the design. */
export function quantityOf(lines: readonly DesignItem[], itemId: string): number {
  return lines.find((line) => line.itemId === itemId)?.qty ?? 0;
}

export interface AddControlState {
  /** The "add" press does something. */
  canAdd: boolean;
  /** Why it does not, shown on the card, or null. */
  reason: string | null;
  /** A card for an item that is not picked and cannot be picked is fully disabled. */
  cardDisabled: boolean;
}

/** Turns the store's `addBlockedReason` into what a card shows. */
export function addControlState(blockedReason: string | null, qty: number): AddControlState {
  return {
    canAdd: blockedReason === null,
    reason: blockedReason,
    cardDisabled: blockedReason !== null && qty === 0,
  };
}

export function addLabel(name: string, qty: number): string {
  return qty > 0 ? `Add one more ${name}` : `Add ${name}`;
}

/**
 * The stepper buttons show only "+" and "−". Their names start with those symbols' words
 * so a voice-control user can say "click plus" (WCAG 2.5.3, label in name).
 */
export function stepperAddLabel(name: string): string {
  return `Plus: add one more ${name}`;
}

export function stepperRemoveLabel(name: string): string {
  return `Minus: remove one ${name}`;
}

/** Spoken by the stepper, for example "Rose: 2 picked". */
export function quantityLabel(name: string, qty: number): string {
  return `${name}: ${qty} picked`;
}

/** Keys the tab list answers to. */
export type TabKey = "ArrowRight" | "ArrowLeft" | "Home" | "End";

export function isTabKey(key: string): key is TabKey {
  return key === "ArrowRight" || key === "ArrowLeft" || key === "Home" || key === "End";
}

/** Index of the tab to move to for an arrow, Home or End key. Arrows wrap around. */
export function nextTabIndex(current: number, key: TabKey, count: number): number {
  if (count <= 0) return 0;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const step = key === "ArrowRight" ? 1 : -1;
  return (current + step + count) % count;
}

/** "2 spaces left", "1 space left", or "No spaces left". Never negative. */
export function spacesLeftText(count: number, maxItems: number): string {
  const left = Math.max(0, maxItems - count);
  if (left === 0) return "No spaces left";
  return `${left} ${left === 1 ? "space" : "spaces"} left`;
}

/** Share of the maximum that is picked, 0 to 100, for the counter's progress bar. */
export function counterPercent(count: number, maxItems: number): number {
  if (maxItems <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((count / maxItems) * 100)));
}

/** The minimum is met, so the counter shows its check. */
export function minimumMet(count: number, minItems: number): boolean {
  return count >= minItems;
}

/**
 * How many picks sit in one tab, for its badge: the sum of quantities of items in that category.
 * "All" has no badge of its own (the counter already says it), so it answers 0.
 */
export function pickedInCategory(
  lines: readonly DesignItem[],
  items: readonly PricedItem[],
  category: string,
): number {
  if (category === ALL_CATEGORY) return 0;
  const inCategory = new Set(
    items.filter((entry) => entry.item.category === category).map((entry) => entry.item.id),
  );
  return lines.reduce((sum, line) => sum + (inCategory.has(line.itemId) ? line.qty : 0), 0);
}

/** Text limits are fixed on the personalise step; every other problem is about the gift itself. */
const NOT_BLOCKING: readonly DesignProblemCode[] = ["TEXT_TOO_LONG"];

export interface ContinueState {
  enabled: boolean;
  /** First count-rule message while disabled, or null. */
  message: string | null;
}

/** The Continue button is on only when the item count and space rules are met. */
export function continueState(problems: readonly DesignProblem[]): ContinueState {
  const blocking = problems.find((problem) => !NOT_BLOCKING.includes(problem.code));
  return blocking
    ? { enabled: false, message: blocking.message }
    : { enabled: true, message: null };
}
