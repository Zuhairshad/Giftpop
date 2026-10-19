"use client";

import { CreateOrderResponseSchema, IDEMPOTENCY_KEY_HEADER } from "@giftpop/contracts";
import type { OrderNumber, PaymentMode, PublicCountry } from "@giftpop/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { EMPTY_FORM, fieldId, firstInvalidField, isContactField } from "./fields";
import type { FieldErrors, FieldName, FormValues } from "./fields";
import { saveOrderHandoff } from "./handoff";
import { createIdempotencyKeys } from "./idempotency";
import { classifyOrderError } from "./order-errors";
import type { OrderFailure } from "./order-errors";
import { buildOrderRequest, requestFingerprint } from "./order-request";
import { buildPaymentCards, resolveSelectedMode } from "./payment-cards";
import type { PaymentCard } from "./payment-cards";
import { checkForm } from "./validate-form";

import type { BuilderApi } from "@/features/builder/state";
import { getSessionStorage } from "@/features/builder/state/persistence";
import { apiRequest } from "@/lib/api";

export interface CheckoutController {
  values: FormValues;
  errors: FieldErrors;
  /** The errors from the last failed submit and a counter for it; the summary shows these. */
  summary: { errors: FieldErrors; attempt: number };
  failure: OrderFailure | null;
  sending: boolean;
  dialCode: string | null;
  cards: PaymentCard[];
  selectedMode: PaymentMode | null;
  setField(field: FieldName, value: string): void;
  selectMode(mode: PaymentMode): void;
  submit(event: FormEvent<HTMLFormElement>): void;
}

/** Form state and the order submission. Prices are only ever read from the builder's API quote. */
export function useCheckout(
  builder: BuilderApi,
  country: PublicCountry,
  onPlaced: (number: OrderNumber) => void,
): CheckoutController {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [summary, setSummary] = useState<{ errors: FieldErrors; attempt: number }>({
    errors: {},
    attempt: 0,
  });
  const [failure, setFailure] = useState<OrderFailure | null>(null);
  const [sending, setSending] = useState(false);
  const [picked, setPicked] = useState<PaymentMode | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: FieldName; n: number } | null>(null);
  const sendingRef = useRef(false);
  const keysRef = useRef(createIdempotencyKeys(() => crypto.randomUUID()));

  const dialCode = country.dialCode ?? null;
  const cards =
    builder.quoteStatus === "ready" && builder.quote
      ? buildPaymentCards(builder.quote.quotes, country.paymentModes)
      : [];
  const selectedMode = resolveSelectedMode(cards, picked);

  useEffect(() => {
    if (focusRequest) document.getElementById(fieldId(focusRequest.field))?.focus();
  }, [focusRequest]);

  const showErrors = useCallback((next: FieldErrors) => {
    setErrors(next);
    setSummary((previous) => ({ errors: next, attempt: previous.attempt + 1 }));
    const first = firstInvalidField(next);
    if (first) setFocusRequest((previous) => ({ field: first, n: (previous?.n ?? 0) + 1 }));
  }, []);

  const setField = useCallback((field: FieldName, value: string) => {
    setValues((current) =>
      isContactField(field)
        ? { ...current, contact: { ...current.contact, [field]: value } }
        : { ...current, address: { ...current.address, [field]: value } },
    );
    setErrors((current) => {
      if (current[field] === undefined) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (sendingRef.current || !builder.design || selectedMode === null) return;

      const checked = checkForm(values, country.addressFormat, dialCode);
      if (!checked.ok) {
        setFailure(null);
        showErrors(checked.errors);
        return;
      }

      const request = buildOrderRequest({
        country: builder.country,
        design: builder.design,
        contact: checked.value.contact,
        address: checked.value.address,
        paymentMode: selectedMode,
      });
      const key = keysRef.current.keyFor(requestFingerprint(request));

      sendingRef.current = true;
      setSending(true);
      setFailure(null);
      setErrors({});
      setSummary((previous) => ({ errors: {}, attempt: previous.attempt }));
      apiRequest("/orders", CreateOrderResponseSchema, {
        method: "POST",
        body: request,
        headers: { [IDEMPOTENCY_KEY_HEADER]: key },
      })
        .then((response) => {
          saveOrderHandoff(getSessionStorage(), response.number, request.contact.phone);
          onPlaced(response.number);
        })
        .catch((error: unknown) => {
          const result = classifyOrderError(error);
          setFailure(result);
          if (result.kind === "fields") showErrors(result.fields);
          sendingRef.current = false;
          setSending(false);
        });
    },
    [builder, country, dialCode, onPlaced, selectedMode, showErrors, values],
  );

  return {
    values,
    errors,
    summary,
    failure,
    sending,
    dialCode,
    cards,
    selectedMode,
    setField,
    selectMode: setPicked,
    submit,
  };
}
