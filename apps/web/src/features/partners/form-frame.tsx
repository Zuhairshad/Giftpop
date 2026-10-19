"use client";

import { PARTNER_HONEYPOT_FIELD } from "@giftpop/contracts";
import { useEffect, useRef } from "react";
import type { ReactElement, ReactNode } from "react";

import { HONEYPOT_INPUT_PROPS, HONEYPOT_WRAPPER_STYLE } from "./request";
import { SUCCESS_MESSAGE, failureMessage } from "./submit-state";
import type { PartnerFormController } from "./use-partner-form";

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
    <div role="status" className="space-y-3">
      <h2 ref={heading} tabIndex={-1} className="font-display text-2xl font-bold outline-none">
        Request sent
      </h2>
      <p>{SUCCESS_MESSAGE}</p>
      {email ? (
        <p className="text-muted wrap-anywhere">
          We will write to <strong className="text-foreground">{email}</strong>.
        </p>
      ) : null}
    </div>
  );
}

/** Heading, pitch, the hidden trap field, the error banner and the Send request button. */
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

  return (
    <section className="bg-surface border-border shadow-pop rounded-blob mx-auto w-full max-w-2xl min-w-0 border p-5 sm:p-10">
      <p className="text-pink-strong text-sm font-bold tracking-wide uppercase">{eyebrow}</p>
      {state.status === "success" ? (
        <div className="mt-3">
          <Success email={controller.values.email?.trim() ?? ""} />
        </div>
      ) : (
        <>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
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
            {children}
            {failure ? (
              <div
                role="alert"
                className="bg-surface-soft border-pink-strong rounded-soft border-2 p-4"
              >
                <p className="font-bold">{failureMessage(failure)}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={sending}
              className="bg-pink text-on-pink hover:bg-pink-strong inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Send request
            </button>
          </form>
        </>
      )}
    </section>
  );
}
