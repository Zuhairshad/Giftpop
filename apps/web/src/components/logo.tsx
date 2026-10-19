import Link from "next/link";

import { cn } from "@/lib/cn";

/** The gift mark: a pink box with a lavender ribbon and bow. Decorative; the link names it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("block flex-none", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="6.5"
        y="18.5"
        width="27"
        height="17.5"
        rx="4"
        fill="#F48DB5"
        stroke="#B5497D"
        strokeWidth="2.4"
      />
      <rect
        x="4.5"
        y="12.5"
        width="31"
        height="8.5"
        rx="3.5"
        fill="#FAB4CE"
        stroke="#B5497D"
        strokeWidth="2.4"
      />
      <rect x="17" y="12.5" width="6" height="23.5" fill="#B79CF0" />
      <path
        d="M20 12.5C13 3 7 7.5 13.5 12.5ZM20 12.5C27 3 33 7.5 26.5 12.5Z"
        fill="#B79CF0"
        stroke="#6B3FB5"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="12.5" r="2.2" fill="#6B3FB5" />
    </svg>
  );
}

/** Gift mark plus the "the gift pop" wordmark. The wordmark font is a placeholder until the owner supplies the real logo. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="The Giftpop, home"
      className={cn(
        "text-primary-pressed -mx-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 no-underline",
        className,
      )}
    >
      <LogoMark className="size-7 sm:size-8" />
      <span
        aria-hidden="true"
        className="font-brand text-xl leading-none whitespace-nowrap sm:text-2xl"
      >
        the gift pop
      </span>
    </Link>
  );
}
