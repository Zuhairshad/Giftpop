import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** A loading placeholder block. Size it with classes (`h-4 w-40`). Decorative, so hidden from assistive tech. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-warm-2 rounded-md motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
