"use client";

import type { ReactElement } from "react";

import { SelectControl, TextAreaControl, TextControl } from "./controls";
import type { CountryOption } from "./controls";
import type { PartnerFieldName } from "./fields";
import { FormFrame } from "./form-frame";
import { usePartnerForm } from "./use-partner-form";

type CountryFormProps = {
  /** Only countries that are not live yet. */
  countries: readonly CountryOption[];
  initialCountry: string;
};

/** Ask us to launch in a country that is not live yet. */
export function CountryForm({ countries, initialCountry }: CountryFormProps): ReactElement {
  const controller = usePartnerForm("country", initialCountry);
  const { values, errors, setField, blurField } = controller;

  const common = (name: PartnerFieldName) => ({
    kind: "country" as const,
    name,
    value: values[name] ?? "",
    error: errors[name],
    onChange: (value: string) => setField(name, value),
    onBlur: () => blurField(name),
  });

  return (
    <FormFrame
      eyebrow="Country partners"
      title="Want The Giftpop in your country?"
      pitch="We open one country at a time, with someone local to source, make and ship the gifts. Tell us about your country and what you can offer."
      controller={controller}
    >
      <SelectControl
        {...common("country")}
        label="Country"
        required
        placeholder="Choose a country"
        options={countries}
      />
      <TextControl
        {...common("contactName")}
        label="Contact name"
        required
        maxLength={80}
        autoComplete="name"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextControl
          {...common("email")}
          label="Email"
          required
          type="email"
          maxLength={200}
          autoComplete="email"
        />
        <TextControl
          {...common("phone")}
          label="Phone"
          required
          type="tel"
          maxLength={20}
          autoComplete="tel"
        />
      </div>
      <TextAreaControl
        {...common("offering")}
        label="What you offer"
        required
        maxLength={1000}
        hint="For example: a workshop, a shop, delivery in your city, or local suppliers."
      />
      <TextAreaControl {...common("message")} label="Message" required={false} maxLength={2000} />
    </FormFrame>
  );
}
