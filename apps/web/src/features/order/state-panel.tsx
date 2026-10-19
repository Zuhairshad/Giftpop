import type { ReactElement, ReactNode } from "react";

type StatePanelProps = {
  tone: "loading" | "error" | "empty";
  children: ReactNode;
  /** A single action, such as a "Try again" button. */
  action?: ReactNode;
};

/** A friendly loading, error or empty state. Errors are announced; loading is a polite status. */
export function StatePanel({ tone, children, action }: StatePanelProps): ReactElement {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex flex-col items-start gap-3 rounded-lg p-5 sm:p-6 ${
        isError ? "bg-surface shadow-hairline border-l-4 border-danger" : "bg-warm"
      }`}
    >
      <div className="flex items-center gap-3">
        {tone === "loading" ? (
          <span
            aria-hidden="true"
            className="size-5 shrink-0 rounded-full border-2 border-border-strong border-t-foreground motion-safe:animate-spin"
          />
        ) : null}
        <p className={`font-semibold wrap-anywhere ${isError ? "text-danger" : "text-foreground"}`}>
          {children}
        </p>
      </div>
      {action}
    </div>
  );
}
