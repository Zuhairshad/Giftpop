import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "tint" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

// Focus ring comes from the global :focus-visible rule (3px, 3px offset). Never remove it here.
// Disabled keeps pointer events so the not-allowed cursor shows; a native disabled button never
// fires, and an aria-disabled one decides in its own handler (it usually explains why it is blocked).
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none " +
  "transition-[background-color,box-shadow,transform] duration-150 motion-safe:active:translate-y-px " +
  "disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0 " +
  "aria-disabled:cursor-not-allowed aria-disabled:shadow-none aria-disabled:active:translate-y-0";

/** The faded look for the secondary variants (they carry no lift to remove). */
const FADED = "disabled:opacity-50 aria-disabled:opacity-50";

/*
 * A disabled primary is neutral, not a washed pink: warm-2 fill with an ink-2 label (about 5.5:1
 * light and 5.8:1 dark), no lift, no hover. disabled: and aria-disabled: sort after hover: and
 * active: in Tailwind, so they win while the pointer is over it.
 */
const PRIMARY_DISABLED =
  "disabled:bg-warm-2 disabled:text-ink-2 aria-disabled:bg-warm-2 aria-disabled:text-ink-2";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-cta hover:bg-primary-pressed active:bg-primary-pressed " +
    PRIMARY_DISABLED,
  tint:
    "bg-primary-tint text-primary-pressed " +
    "hover:bg-[color-mix(in_srgb,var(--gp-pink-soft),var(--gp-pink)_14%)] " +
    "active:bg-[color-mix(in_srgb,var(--gp-pink-soft),var(--gp-pink)_22%)] " +
    FADED,
  ghost: "bg-transparent text-ink hover:bg-warm active:bg-warm-2 " + FADED,
};

/** Heights are touch targets: 44 (sm), 48 (md), 56 (lg, the one main call to action). */
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-[17px] sm:text-lg",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string | undefined;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], block && "w-full", className);
}

type ButtonOptions = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

/** One primary action per screen. Label says what it does ("Place order"), never "Submit". */
export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonOptions) {
  return (
    <button type={type} className={buttonClass({ variant, size, block, className })} {...props} />
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonOptions) {
  // A link has no disabled state of its own: an aria-disabled one must not navigate.
  return (
    <Link
      className={buttonClass({
        variant,
        size,
        block,
        className: cn("aria-disabled:pointer-events-none", className),
      })}
      {...props}
    />
  );
}
