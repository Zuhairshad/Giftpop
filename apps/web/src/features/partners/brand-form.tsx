"use client";

import type { PublicCountry } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { SelectControl, TextAreaControl, TextControl } from "./controls";
import { FIELD_LABELS } from "./fields";
import type { PartnerFieldName } from "./fields";
import { FormFrame } from "./form-frame";
import { usePartnerForm } from "./use-partner-form";

type BrandFormProps = { countries: readonly PublicCountry[] };

/** The brand pitch and fields. Countries come from the API (all of them, live or not). */
export function BrandForm({ countries }: BrandFormProps): ReactElement {
  const controller = usePartnerForm("brand", "");
  const { values, errors, setField, blurField } = controller;

  const common = (name: PartnerFieldName) => ({
    kind: "brand" as const,
    name,
    value: values[name] ?? "",
    error: errors[name],
    onChange: (value: string) => setField(name, value),
    onBlur: () => blurField(name),
  });

  return (
    <FormFrame
      eyebrow="Brand partners"
      title="Want your products in our gifts?"
      pitch="Tell us about your brand. If your products fit, we will feature them as items in the gifts people build, and make them up by hand."
      controller={controller}
    >
      <TextControl
        {...common("brandName")}
        label={FIELD_LABELS.brandName}
        required
        maxLength={120}
        autoComplete="organization"
      />
      <TextControl
        {...common("contactName")}
        label={FIELD_LABELS.contactName}
        required
        maxLength={80}
        autoComplete="name"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextControl
          {...common("email")}
          label={FIELD_LABELS.email}
          required
          type="email"
          maxLength={200}
          autoComplete="email"
        />
        <TextControl
          {...common("phone")}
          label={FIELD_LABELS.phone}
          required
          type="tel"
          maxLength={20}
          autoComplete="tel"
        />
      </div>
      <SelectControl
        {...common("country")}
        label={FIELD_LABELS.country}
        required
        placeholder="Choose a country"
        options={countries}
      />
      <TextControl
        {...common("categories")}
        label={FIELD_LABELS.categories}
        required
        hint="Separate with commas, for example: candles, tea, chocolate."
      />
      <TextControl
        {...common("link")}
        label={FIELD_LABELS.link}
        required
        maxLength={300}
        autoComplete="url"
      />
      <TextAreaControl
        {...common("message")}
        label={FIELD_LABELS.message}
        required={false}
        maxLength={2000}
      />
    </FormFrame>
  );
}
