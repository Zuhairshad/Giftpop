import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "tint" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-pink text-on-pink shadow-cta hover:bg-pink-strong",
  tint: "bg-pink-soft text-pink-strong hover:bg-pink-soft/70",
  ghost: "bg-transparent text-foreground hover:bg-warm",
};

/** Heights are touch targets: 44 (sm), 48 (md), 56 (lg, the one main call to action). */
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
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
  return <Link className={buttonClass({ variant, size, block, className })} {...props} />;
}
