/** Shared class names for the checkout, order and track screens (design tokens only, never hex). */

/** A hairline card on the cream canvas. */
export const CARD = "bg-surface rounded-lg shadow-hairline p-5 sm:p-6";

/** A 48px input: visible label above, hairline-2 border, 12px radius. */
export const INPUT =
  "block min-h-12 w-full min-w-0 rounded-md border border-border-strong bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-muted/70 focus-visible:border-foreground aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger";

export const FIELD_LABEL = "mb-1.5 block text-sm font-semibold text-foreground";

/** Card titles: display type, tight tracking. */
export const CARD_TITLE = "font-display text-2xl leading-tight font-bold tracking-tight";

/** The small label above a value. */
export const META_LABEL = "text-sm font-medium text-muted";

/** The warm well behind illustrations and highlighted amounts. */
export const WELL = "bg-warm rounded-lg";

/** Extra classes that make `<Button variant="ghost">` a secondary button on a white hairline. */
export const SECONDARY = "bg-surface shadow-hairline hover:bg-warm";
