import { cn } from "cn";
import type { ReactNode } from "react";

interface ScrollRegionProps {
  /** Names the region for screen readers, for example "Orders". */
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * A sideways-scrolling wrapper that a keyboard user can focus and scroll with the arrow keys.
 * A scrollable area that cannot take focus hides its columns from keyboard users.
 */
export function ScrollRegion({ label, className, children }: ScrollRegionProps) {
  return (
    <div
      role="region"
      tabIndex={0}
      aria-label={label}
      className={cn(
        "relative w-full overflow-x-auto rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </div>
  );
}
