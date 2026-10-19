"use client";

import type { PublicOrderView } from "@giftpop/contracts";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { FieldError } from "./field-error";
import { describeLookupError, lookupOrder, parseLookupInput } from "./lookup";
import type { LookupFieldErrors } from "./lookup";
import { FIELD_LABEL, INPUT, META_LABEL, WELL } from "./ui";

import { Button } from "@/components/ui";

type LookupFormProps = {
  /** Prefills the order number. */
  initialNumber?: string;
  /** When set, the number is known and shown as text instead of asked for. */
  fixedNumber?: string;
  submitLabel: string;
  /** A message to show before the visitor submits, such as "we could not find that order". */
  initialNotice?: string;
  onFound: (view: PublicOrderView, contact: string) => void;
};

/** Order number plus the phone or email used; looks the order up and hands it to `onFound`. */
export function LookupForm({
  initialNumber = "",
  fixedNumber,
  submitLabel,
  initialNotice,
  onFound,
}: LookupFormProps): ReactElement {
  const uid = useId();
  const [number, setNumber] = useState(initialNumber);
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState<LookupFieldErrors>({});
  const [failure, setFailure] = useState<string | null>(initialNotice ?? null);
  const [busy, setBusy] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    const parsed = parseLookupInput({ number: fixedNumber ?? number, contact });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFailure(null);
      (parsed.errors.number ? numberRef.current : contactRef.current)?.focus();
      return;
    }
    setErrors({});
    setFailure(null);
    setBusy(true);
    try {
      const view = await lookupOrder(parsed.value);
      onFound(view, parsed.value.contact);
    } catch (error) {
      setFailure(describeLookupError(error).message);
    } finally {
      setBusy(false);
    }
  }

  const numberErrorId = `${uid}-number-error`;
  const contactErrorId = `${uid}-contact-error`;
  const failureId = `${uid}-failure`;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-lg bg-surface p-5 shadow-hairline sm:p-6"
    >
      {fixedNumber ? (
        <p className={`${WELL} p-4 wrap-anywhere`}>
          <span className={META_LABEL}>Order number</span>
          <br />
          <span className="font-display text-2xl font-bold tracking-tight">{fixedNumber}</span>
        </p>
      ) : (
        <div>
          <label htmlFor={`${uid}-number`} className={FIELD_LABEL}>
            Order number
          </label>
          <input
            ref={numberRef}
            id={`${uid}-number`}
            name="number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="GP-PK-7K2M9Q"
            aria-invalid={errors.number ? true : undefined}
            aria-describedby={errors.number ? numberErrorId : undefined}
            className={INPUT}
          />
          {errors.number ? <FieldError id={numberErrorId}>{errors.number}</FieldError> : null}
        </div>
      )}

      <div>
        <label htmlFor={`${uid}-contact`} className={FIELD_LABEL}>
          Phone or email used to order
        </label>
        <input
          ref={contactRef}
          id={`${uid}-contact`}
          name="contact"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          autoComplete="off"
          maxLength={200}
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={errors.contact ? contactErrorId : undefined}
          className={INPUT}
        />
        {errors.contact ? <FieldError id={contactErrorId}>{errors.contact}</FieldError> : null}
      </div>

      <div aria-live="polite" id={failureId}>
        {failure ? (
          <p className="rounded-md bg-warm p-3 text-sm font-semibold wrap-anywhere">{failure}</p>
        ) : null}
        {busy ? <p className="sr-only">Looking up your order</p> : null}
      </div>

      <Button type="submit" disabled={busy} block className="sm:w-auto">
        {busy ? "Looking up…" : submitLabel}
      </Button>
    </form>
  );
}
