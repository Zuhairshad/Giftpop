"use client";

import type { PublicCountry } from "@giftpop/contracts";
import Link from "next/link";
import type { ReactElement } from "react";

import { buildAddressFields } from "./address-fields";
import { ErrorSummary } from "./error-summary";
import { errorSummaryEntries } from "./error-summary-model";
import type { FieldName } from "./fields";
import { failureMessage, needsItemsLink } from "./order-errors";
import { PaymentSection } from "./payment-section";
import { TextField } from "./text-field";
import { useCheckout } from "./use-checkout";
import type { CheckoutController } from "./use-checkout";

import { stepHref } from "@/features/builder/state";
import type { BuilderApi } from "@/features/builder/state";
import { formatMoney } from "@/lib/format-money";

const SECTION_HEADING = "font-display mb-3 text-2xl font-bold";

const CONTACT_LABELS = { name: "Full name", email: "Email", phone: "Phone" } as const;

function Failure({
  controller,
  builder,
}: {
  controller: CheckoutController;
  builder: BuilderApi;
}): ReactElement | null {
  const { failure } = controller;
  const message = failure ? failureMessage(failure) : null;
  if (!failure || !message) return null;
  return (
    <div
      role="alert"
      className="bg-surface-soft border-pink-strong rounded-soft space-y-2 border-2 p-4"
    >
      <p className="font-bold">{message}</p>
      {needsItemsLink(failure) ? (
        <Link
          href={stepHref(builder.country, "items")}
          className="text-pink-strong font-semibold underline underline-offset-4"
        >
          Back to your items
        </Link>
      ) : null}
    </div>
  );
}

type CheckoutFormProps = {
  builder: BuilderApi;
  country: PublicCountry;
  controller: CheckoutController;
};

/** Contact, address (generated from the country's format), payment and the Place order button. */
export function CheckoutFormView({
  builder,
  country,
  controller,
}: CheckoutFormProps): ReactElement {
  const { values, errors, setField, sending, selectedMode, cards } = controller;
  const addressFields = buildAddressFields(country.addressFormat);
  const selectedCard = cards.find((card) => card.mode === selectedMode);
  const canSubmit = !sending && selectedCard !== undefined;
  const labels: Partial<Record<FieldName, string>> = {
    ...CONTACT_LABELS,
    ...Object.fromEntries(addressFields.map((field) => [field.name, field.label])),
  };
  const summaryEntries = errorSummaryEntries(controller.summary.errors, labels);

  return (
    <form noValidate onSubmit={controller.submit} className="min-w-0 space-y-8">
      <ErrorSummary key={controller.summary.attempt} entries={summaryEntries} />
      <section aria-labelledby="checkout-contact-heading">
        <h2 id="checkout-contact-heading" className={SECTION_HEADING}>
          Your details
        </h2>
        <div className="grid gap-4">
          <TextField
            name="name"
            label={CONTACT_LABELS.name}
            required
            value={values.contact.name}
            onChange={(v) => setField("name", v)}
            error={errors.name}
            autoComplete="name"
            maxLength={80}
          />
          <TextField
            name="email"
            label={CONTACT_LABELS.email}
            required
            type="email"
            inputMode="email"
            value={values.contact.email}
            onChange={(v) => setField("email", v)}
            error={errors.email}
            autoComplete="email"
            maxLength={200}
          />
          <TextField
            name="phone"
            label={CONTACT_LABELS.phone}
            required
            type="tel"
            inputMode="tel"
            prefix={controller.dialCode}
            hint="We use this to contact you about delivery."
            value={values.contact.phone}
            onChange={(v) => setField("phone", v)}
            error={errors.phone}
            autoComplete="tel-national"
            maxLength={20}
          />
        </div>
      </section>

      <section aria-labelledby="checkout-address-heading">
        <h2 id="checkout-address-heading" className={SECTION_HEADING}>
          Delivery address
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {addressFields.map((field) => (
            <div
              key={field.name}
              className={field.name === "line1" || field.name === "line2" ? "sm:col-span-2" : ""}
            >
              <TextField
                name={field.name}
                label={field.label}
                required={field.required}
                value={values.address[field.name]}
                onChange={(v) => setField(field.name, v)}
                error={errors[field.name]}
                autoComplete={field.autoComplete}
                maxLength={field.maxLength}
              />
            </div>
          ))}
        </div>
        <p className="text-muted mt-3 text-sm">
          Delivering to {country.name}. Usually {country.shipping.deliveryDays.min} to{" "}
          {country.shipping.deliveryDays.max} days.
        </p>
      </section>

      <PaymentSection
        cards={cards}
        selected={selectedMode}
        onSelect={controller.selectMode}
        loading={builder.quoteStatus === "loading" || builder.quoteStatus === "idle"}
      />

      <div className="space-y-3">
        <Failure controller={controller} builder={builder} />
        <p className="text-muted text-sm">
          By placing this order you agree to our terms of sale and delivery. Your gift is made by
          hand once your payment is recorded.
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-pink text-on-pink hover:bg-pink-strong inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sending ? "Placing your order…" : "Place order"}
        </button>
        {selectedCard ? (
          <p className="text-muted text-sm" aria-live="polite">
            You pay {formatMoney(selectedCard.dueNow.minor, selectedCard.currency)} now.
          </p>
        ) : null}
      </div>
    </form>
  );
}

/** Wires the controller to the view once the country has loaded. */
export function CheckoutForm({
  builder,
  country,
  onPlaced,
}: {
  builder: BuilderApi;
  country: PublicCountry;
  onPlaced: Parameters<typeof useCheckout>[2];
}): ReactElement {
  const controller = useCheckout(builder, country, onPlaced);
  return <CheckoutFormView builder={builder} country={country} controller={controller} />;
}
