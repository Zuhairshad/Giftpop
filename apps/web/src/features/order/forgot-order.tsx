"use client";

import { useId, useState } from "react";
import type { FormEvent, ReactElement } from "react";

import { FieldError } from "./field-error";
import { describeLookupError, parseForgotInput, requestOrderLinks } from "./lookup";
import { FIELD_LABEL, INPUT, SECONDARY } from "./ui";

import { Button } from "@/components/ui";

export const FORGOT_SENT_MESSAGE =
  "If we have an order with those details, we have emailed the order number and a link. It can take a minute to arrive. Check your spam folder too.";

/** "Forgot your order number?": emails the customer their order links. The answer is always the same. */
export function ForgotOrder(): ReactElement {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    const parsed = parseForgotInput(contact);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestOrderLinks(parsed.value);
      setSent(true);
    } catch (failure) {
      setError(describeLookupError(failure).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)} className={SECONDARY}>
        Forgot your order number?
      </Button>
    );
  }

  const inputId = `${uid}-contact`;
  const errorId = `${uid}-error`;
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-lg bg-surface p-5 shadow-hairline sm:p-6"
    >
      <p className="font-semibold">Forgot your order number?</p>
      <p className="text-sm text-muted">
        Enter the email or phone number you used to order. We will email you the order number and a
        link to track it.
      </p>
      <div>
        <label htmlFor={inputId} className={FIELD_LABEL}>
          Phone or email used to order
        </label>
        <input
          id={inputId}
          name="contact"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          autoComplete="off"
          maxLength={200}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={INPUT}
        />
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </div>
      <div aria-live="polite">
        {sent ? (
          <p className="rounded-md bg-warm p-3 text-sm font-semibold wrap-anywhere">
            {FORGOT_SENT_MESSAGE}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={busy} block className="sm:w-auto">
        {busy ? "Sending…" : "Email me my order number"}
      </Button>
    </form>
  );
}
