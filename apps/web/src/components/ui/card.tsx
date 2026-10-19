import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A hairline surface with a 12px radius. `raised` adds the soft level-2 shadow (floating objects only). */
export function Card({
  raised = false,
  className,
  ...props
}: ComponentProps<"div"> & { raised?: boolean }) {
  return (
    <div
      className={cn(
        "bg-surface text-ink rounded-md",
        raised ? "shadow-lift" : "shadow-hairline",
        className,
      )}
      {...props}
    />
  );
}
