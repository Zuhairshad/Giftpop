import { cn } from "@/lib/cn";

/** A small spinner that inherits the text colour. Under reduced motion it stays still (a partial ring). */
export function Spinner({
  label = "Loading",
  className,
}: {
  /** Read out by screen readers. Say what is loading ("Placing your order"). */
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" className="inline-flex items-center">
      <svg
        viewBox="0 0 24 24"
        className={cn("size-5 motion-safe:animate-spin", className)}
        aria-hidden="true"
        focusable="false"
        fill="none"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
