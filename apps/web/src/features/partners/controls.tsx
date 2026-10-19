import type { PartnerRequestKind } from "@giftpop/contracts";
import type { ReactElement, ReactNode } from "react";

import { partnerFieldId } from "./fields";
import type { PartnerFieldName } from "./fields";

const CONTROL =
  "border-border-strong bg-surface text-foreground placeholder:text-muted/70 min-h-12 min-w-0 w-full rounded-md border px-4 py-3 text-base focus-visible:border-foreground aria-[invalid=true]:border-danger aria-[invalid=true]:border-2";

type CommonProps = {
  kind: PartnerRequestKind;
  name: PartnerFieldName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  required: boolean;
  hint?: string;
};

/** A small alert circle, so an error is never shown by colour alone. */
export function ErrorIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      className="mt-0.5 flex-none"
    >
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 4.2v4.6" stroke="var(--gp-surface)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="11.4" r="1" fill="var(--gp-surface)" />
    </svg>
  );
}

function Shell({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {required ? null : <span className="text-muted ml-2 font-normal">(optional)</span>}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-muted mt-1.5 text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-danger mt-1.5 flex items-start gap-1.5 text-sm font-semibold"
        >
          <ErrorIcon />
          <span className="min-w-0 wrap-anywhere">{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type TextProps = CommonProps & {
  type?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  maxLength?: number;
};

/** A labelled input. The error is read out with the field and the field is marked invalid. */
export function TextControl(props: TextProps): ReactElement {
  const { kind, name, label, value, onChange, onBlur, error, required, hint } = props;
  const id = partnerFieldId(kind, name);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        name={name}
        type={props.type ?? "text"}
        value={value}
        required={required}
        maxLength={props.maxLength}
        autoComplete={props.autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={CONTROL}
      />
    </Shell>
  );
}

export function TextAreaControl(
  props: CommonProps & { maxLength: number; rows?: number },
): ReactElement {
  const { kind, name, label, value, onChange, onBlur, error, required, hint } = props;
  const id = partnerFieldId(kind, name);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        value={value}
        rows={props.rows ?? 4}
        required={required}
        maxLength={props.maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`${CONTROL} min-h-28 resize-y`}
      />
    </Shell>
  );
}

export type CountryOption = { code: string; name: string };

export function SelectControl(
  props: CommonProps & { options: readonly CountryOption[]; placeholder: string },
): ReactElement {
  const { kind, name, label, value, onChange, onBlur, error, required, hint } = props;
  const id = partnerFieldId(kind, name);
  return (
    <Shell id={id} label={label} required={required} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        autoComplete="country"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={CONTROL}
      >
        <option value="">{props.placeholder}</option>
        {props.options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
    </Shell>
  );
}
