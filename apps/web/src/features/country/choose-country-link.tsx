"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { rememberCountry } from "./remember-country";

type ChooseCountryLinkProps = {
  /** Upper-case ISO code. */
  code: string;
  className?: string;
  children: ReactNode;
  onChosen?: () => void;
};

/** A link to `/<cc>` that also remembers the country in the `gp_country` cookie. */
export function ChooseCountryLink({ code, className, children, onChosen }: ChooseCountryLinkProps) {
  return (
    <Link
      href={`/${code.toLowerCase()}`}
      className={className}
      onClick={() => {
        rememberCountry(code);
        onChosen?.();
      }}
    >
      {children}
    </Link>
  );
}
