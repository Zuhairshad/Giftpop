import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-medium text-foreground shadow-hairline";

/** A small pill label (not interactive). */
export function Chip({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(CHIP, "min-h-8", className)} {...props} />;
}

/** An interactive pill (country, filters). 44px tall so it is a real touch target. */
export function ChipButton({ className, type = "button", ...props }: ComponentProps<"button">) {
  return (
    <button type={type} className={cn(CHIP, "min-h-11 hover:bg-warm", className)} {...props} />
  );
}

/** A category tab: selected is ink on white text, not pink (pink means "act"). */
export function PillTab({
  selected,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type={type}
      role="tab"
      aria-selected={selected}
      className={cn(
        "inline-flex min-h-11 flex-none items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:bg-warm",
        className,
      )}
      {...props}
    />
  );
}
