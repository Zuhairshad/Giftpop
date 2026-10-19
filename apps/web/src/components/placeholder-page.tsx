import type { ReactNode } from "react";

import { GiftIllustration } from "./gift-illustration";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  /** Shown as a small status note so it is clear what is not built yet. */
  status: string;
};

/** Shared frame for routes whose real screens arrive in later phases. */
export function PlaceholderPage({ eyebrow, title, children, status }: PlaceholderPageProps) {
  return (
    <section className="bg-surface border-border shadow-pop relative overflow-hidden rounded-blob border p-6 sm:p-10">
      <div className="max-w-xl">
        <p className="text-pink-strong text-sm font-bold tracking-wide uppercase">{eyebrow}</p>
        <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
        <div className="text-muted mt-4 space-y-3 text-base">{children}</div>
        <p className="bg-pink-soft text-foreground mt-6 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
          {status}
        </p>
      </div>
      <GiftIllustration className="gp-float pointer-events-none absolute right-6 bottom-4 hidden w-56 sm:block" />
    </section>
  );
}
