import { cn } from "cn";
import { useId } from "react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string;
  /** Receives the id and aria props to put on the control, so the label and error are linked. */
  children: (control: FieldControlProps) => ReactNode;
}

/** A labelled control with an optional hint and an inline error. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("grid grid-cols-1 content-start gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy === "" ? undefined : describedBy,
      })}
      {hint ? (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A switch or checkbox with its label beside it and an optional description. */
export function ToggleRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: (control: { id: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <div className="pt-0.5">{children({ id })}</div>
      <div className="grid grid-cols-1 gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
      </div>
    </div>
  );
}

/** The sentence an API failure produces, shown above a form's buttons. */
export function FormAlert({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
    >
      {message}
    </div>
  );
}
