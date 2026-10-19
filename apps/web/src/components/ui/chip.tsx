import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A category tab. Selected is ink fill with a canvas label, not pink (pink means "act").
 * `count` shows how many picks the category holds (hidden when 0 or omitted).
 */
export function PillTab({
  selected,
  count,
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & { selected: boolean; count?: number }) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={selected}
      className={cn(
        "inline-flex min-h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
        "transition-colors disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-ink bg-ink text-canvas"
          : "border-hairline bg-surface text-ink hover:bg-warm active:bg-warm-2",
        className,
      )}
      {...props}
    >
      {children}
      {count ? (
        <span
          className={cn(
            "inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold",
            selected ? "bg-canvas text-ink" : "bg-primary-tint text-primary-pressed",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
