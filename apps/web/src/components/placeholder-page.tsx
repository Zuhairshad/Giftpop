import type { ItemShape } from "@giftpop/contracts";
import { ItemIllustrationSvg } from "@giftpop/renderer";
import type { ReactElement, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Illustration colours are objects, not UI: they stay the same in light and dark. */
const ART: readonly { shape: ItemShape; color: string; className: string }[] = [
  { shape: "jar", color: "#B79CF0", className: "left-0 bottom-3 w-[34%] -rotate-6" },
  { shape: "box", color: "#E8527F", className: "left-[27%] bottom-0 w-[46%]" },
  { shape: "flower", color: "#F28DB2", className: "right-0 bottom-4 w-[34%] rotate-6" },
];

/** A small cluster of item illustrations on a soft pink disc, used by empty and error states. */
export function StateArt({ className }: { className?: string }): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-pink-soft relative mx-auto aspect-square w-40 rounded-full", className)}
    >
      {ART.map((piece) => (
        <ItemIllustrationSvg
          key={piece.shape}
          shape={piece.shape}
          color={piece.color}
          className={cn("absolute", piece.className)}
        />
      ))}
    </div>
  );
}

type StatePanelProps = {
  title: string;
  /** Plain sentence under the title. */
  children: ReactNode;
  /** Buttons and links. The first one should be the one clear way back or forward. */
  actions?: ReactNode;
  /** Handwritten line above the title (20px or larger, never body copy). */
  script?: string;
  headingId?: string;
  role?: "alert" | "status";
};

/**
 * One calm frame for "nothing here", "something broke" and "not found" screens:
 * illustration, plain copy, a clear way back. Works in server and client components.
 */
export function StatePanel({
  title,
  children,
  actions,
  script,
  headingId,
  role,
}: StatePanelProps): ReactElement {
  return (
    <section
      aria-labelledby={headingId}
      role={role}
      className="mx-auto flex w-full max-w-xl min-w-0 flex-col items-center py-8 text-center sm:py-14"
    >
      <StateArt />
      {script ? (
        <p
          aria-hidden="true"
          className="font-script text-lavender-deep mt-6 text-2xl leading-none font-bold"
        >
          {script}
        </p>
      ) : null}
      <h1
        id={headingId}
        className={cn(
          "font-display text-3xl leading-tight font-bold tracking-tight wrap-anywhere sm:text-4xl",
          script ? "mt-2" : "mt-6",
        )}
      >
        {title}
      </h1>
      <div className="text-muted mt-3 max-w-md text-base wrap-anywhere">{children}</div>
      {actions ? (
        <div className="mt-7 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          {actions}
        </div>
      ) : null}
    </section>
  );
}

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
    <section className="bg-surface shadow-hairline relative overflow-hidden rounded-lg p-6 sm:p-10">
      <div className="max-w-xl">
        <p className="font-script text-lavender-deep text-2xl font-bold">{eyebrow}</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <div className="text-muted mt-4 space-y-3 text-base">{children}</div>
        <p className="bg-lavender text-lavender-deep mt-6 inline-block rounded-full px-4 py-1.5 text-sm font-semibold">
          {status}
        </p>
      </div>
      <StateArt className="absolute right-6 bottom-4 hidden w-40 sm:block" />
    </section>
  );
}
