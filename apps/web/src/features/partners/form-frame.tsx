"use client";

import { PARTNER_HONEYPOT_FIELD } from "@giftpop/contracts";
import { useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";

import { ErrorSummary } from "./error-summary";
import { HONEYPOT_INPUT_PROPS, HONEYPOT_WRAPPER_STYLE } from "./request";
import { SUCCESS_MESSAGE, failureMessage } from "./submit-state";
import type { PartnerFormController } from "./use-partner-form";

import { Button } from "@/components/ui";

type FormFrameProps = {
  eyebrow: string;
  title: string;
  pitch: string;
  controller: PartnerFormController;
  children: ReactNode;
};

function Success({ email }: { email: string }): ReactElement {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div role="status" className="flex flex-col items-start gap-3 py-4">
      <span
        aria-hidden="true"
        className="bg-success-tint text-success flex size-14 items-center justify-center rounded-full"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </span>
      <p
        aria-hidden="true"
        className="font-script text-lavender-deep text-3xl leading-none font-bold"
      >
        Thank you
      </p>
      <h1
        ref={heading}
        tabIndex={-1}
        className="font-display text-3xl font-bold tracking-tight outline-none"
      >
        Request sent
      </h1>
      <p>{SUCCESS_MESSAGE}</p>
      {email ? (
        <p className="text-muted wrap-anywhere">
          We will write to <strong className="text-foreground">{email}</strong>.
        </p>
      ) : null}
    </div>
  );
}

/** Heading, pitch, the hidden trap field, the error summary and the Send request button. */
export function FormFrame({
  eyebrow,
  title,
  pitch,
  controller,
  children,
}: FormFrameProps): ReactElement {
  const { state, kind } = controller;
  const sending = state.status === "sending";
  const failure = state.status === "idle" ? state.failure : undefined;
  // Field problems are listed in the summary; the banner is for everything else.
  const banner = failure && failure.kind !== "fields" ? failure : undefined;

  return (
    <section className="bg-surface shadow-hairline mx-auto w-full max-w-2xl min-w-0 rounded-lg p-5 sm:p-10">
      {state.status === "success" ? (
        <Success email={controller.values.email?.trim() ?? ""} />
      ) : (
        <>
          <p className="font-script text-lavender-deep text-2xl leading-none font-bold">
            {eyebrow}
          </p>
          <h1 className="font-display mt-2 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted mt-3 text-base">{pitch}</p>
          <form noValidate onSubmit={controller.submit} className="mt-6 min-w-0 space-y-5">
            <div aria-hidden="true" style={HONEYPOT_WRAPPER_STYLE}>
              <input
                {...HONEYPOT_INPUT_PROPS}
                id={`partner-${kind}-${PARTNER_HONEYPOT_FIELD}`}
                value={controller.honeypot}
                onChange={(event) => controller.setHoneypot(event.target.value)}
              />
            </div>
            {controller.summaryOpen ? (
              <ErrorSummary kind={kind} errors={controller.errors} />
            ) : null}
            {children}
            {banner ? (
              <div role="alert" className="bg-warm border-danger rounded-md border-2 p-4">
                <p className="font-semibold">{failureMessage(banner)}</p>
              </div>
            ) : null}
            <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
              Send request
            </Button>
          </form>
        </>
      )}
    </section>
  );
}
