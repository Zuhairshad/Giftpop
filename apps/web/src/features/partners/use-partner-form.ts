"use client";

import { PartnerRequestReceivedSchema } from "@giftpop/contracts";
import type { PartnerRequestKind } from "@giftpop/contracts";
import { useReducer, useRef, useState } from "react";
import type { FormEvent } from "react";

import { shouldValidateOnBlur } from "./blur-policy";
import { emptyValues, fieldsFor, partnerFieldId } from "./fields";
import type { PartnerFieldErrors, PartnerFieldName, PartnerValues } from "./fields";
import { fieldMessage, firstInvalidField, validatePartnerForm, withHoneypot } from "./request";
import { INITIAL_SUBMIT_STATE, classifySubmitError, submitReducer } from "./submit-state";
import type { SubmitState } from "./submit-state";

import { apiRequest } from "@/lib/api";

export type PartnerFormController = {
  kind: PartnerRequestKind;
  values: PartnerValues;
  errors: PartnerFieldErrors;
  honeypot: string;
  state: SubmitState;
  setField: (name: PartnerFieldName, value: string) => void;
  setHoneypot: (value: string) => void;
  blurField: (name: PartnerFieldName) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
};

function focusField(kind: PartnerRequestKind, name: PartnerFieldName | undefined): void {
  if (!name) return;
  document.getElementById(partnerFieldId(kind, name))?.focus();
}

function withoutError(errors: PartnerFieldErrors, name: PartnerFieldName): PartnerFieldErrors {
  const next = { ...errors };
  delete next[name];
  return next;
}

/** Controlled values, inline validation with the contract schema, and one guarded submit. */
export function usePartnerForm(
  kind: PartnerRequestKind,
  initialCountry: string,
): PartnerFormController {
  const [values, setValues] = useState<PartnerValues>(() => emptyValues(kind, initialCountry));
  const [errors, setErrors] = useState<PartnerFieldErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [state, dispatch] = useReducer(submitReducer, INITIAL_SUBMIT_STATE);
  // Blocks a second submit in the same tick, before React has re-rendered the disabled button.
  const inFlight = useRef(false);
  const edited = useRef(new Set<PartnerFieldName>());
  const submitAttempted = useRef(false);

  function setField(name: PartnerFieldName, value: string): void {
    edited.current.add(name);
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (current[name] === undefined) return current;
      return withoutError(current, name);
    });
  }

  function blurField(name: PartnerFieldName): void {
    if (!shouldValidateOnBlur(edited.current.has(name), submitAttempted.current)) return;
    const result = validatePartnerForm(kind, values);
    const message = result.ok ? undefined : result.errors[name];
    setErrors((current) => {
      if (message === undefined) {
        if (current[name] === undefined) return current;
        return withoutError(current, name);
      }
      return { ...current, [name]: message };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (inFlight.current || state.status !== "idle") return;
    submitAttempted.current = true;

    const result = validatePartnerForm(kind, values);
    if (!result.ok) {
      setErrors(result.errors);
      focusField(kind, firstInvalidField(fieldsFor(kind), result.errors));
      return;
    }

    inFlight.current = true;
    setErrors({});
    dispatch({ type: "submit" });
    apiRequest("/partner-requests", PartnerRequestReceivedSchema, {
      method: "POST",
      body: withHoneypot(result.request, honeypot),
    })
      .then(() => dispatch({ type: "succeeded" }))
      .catch((error: unknown) => {
        const failure = classifySubmitError(kind, error, (name) =>
          fieldMessage(name, "invalid", false),
        );
        dispatch({ type: "failed", failure });
        if (failure.kind === "fields") {
          setErrors(failure.fields);
          focusField(kind, firstInvalidField(fieldsFor(kind), failure.fields));
        }
      })
      .finally(() => {
        inFlight.current = false;
      });
  }

  return { kind, values, errors, honeypot, state, setField, setHoneypot, blurField, submit };
}
