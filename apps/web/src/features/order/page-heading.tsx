import type { ReactElement, ReactNode } from "react";

type PageHeadingProps = {
  title: string;
  /** A short handmade line above the title (script type). One per page. */
  eyebrow?: string;
  children?: ReactNode;
};

/** The page title for checkout, order and track: display type with tight tracking. */
export function PageHeading({ title, eyebrow, children }: PageHeadingProps): ReactElement {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p aria-hidden="true" className="font-script text-lavender-deep text-2xl leading-none">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-4xl leading-[1.02] font-bold tracking-[-1.6px] wrap-anywhere sm:text-5xl sm:tracking-[-2.2px]">
        {title}
      </h1>
      {children ? (
        <div className="text-muted max-w-[62ch] text-base sm:text-lg">{children}</div>
      ) : null}
    </header>
  );
}
