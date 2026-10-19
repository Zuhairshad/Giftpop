"use client";

import type { Country } from "@giftpop/contracts";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { PAYMENT_MODE_OPTIONS, toggleMode } from "../lib/country-form";

import { Field, ToggleRow } from "./field";
import { MoneyInput, moneyTextProblem } from "./money-input";
import { OptionSelect } from "./option-select";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CountryFormApi = UseFormReturn<Country, unknown, Country>;

const STATUS_OPTIONS = [
  { value: "live", label: "Live" },
  { value: "coming_soon", label: "Coming soon" },
];

interface CountryFieldsProps {
  form: CountryFormApi;
  /** An existing country: its code and currency are fixed, because prices are stored in them. */
  existing: boolean;
}

export function CountryFields({ form, existing }: CountryFieldsProps) {
  const { register, control, watch, formState } = form;
  const { errors } = formState;
  const currency = watch("currency") || "";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Country code" error={errors.code?.message} hint="Two letters, such as PK.">
        {(field) => (
          <Input
            {...field}
            maxLength={2}
            autoComplete="off"
            readOnly={existing}
            className="read-only:bg-muted read-only:text-muted-foreground uppercase"
            {...register("code", { setValueAs: (value: string) => value.trim().toUpperCase() })}
          />
        )}
      </Field>
      <Field label="Name" error={errors.name?.message}>
        {(field) => <Input {...field} autoComplete="off" {...register("name")} />}
      </Field>
      <Field
        label="Currency"
        error={errors.currency?.message}
        hint={existing ? "Fixed, because prices are saved in it." : "Three letters, such as PKR."}
      >
        {(field) => (
          <Input
            {...field}
            maxLength={3}
            autoComplete="off"
            readOnly={existing}
            className="read-only:bg-muted read-only:text-muted-foreground uppercase"
            {...register("currency", { setValueAs: (value: string) => value.trim().toUpperCase() })}
          />
        )}
      </Field>
      <Field label="Phone dial code (optional)" error={errors.dialCode?.message}>
        {(field) => (
          <Input
            {...field}
            placeholder="+92"
            maxLength={5}
            autoComplete="off"
            {...register("dialCode", {
              setValueAs: (value: string) => value.trim() || undefined,
            })}
          />
        )}
      </Field>
      <Field label="Status" error={errors.status?.message}>
        {(field) => (
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <OptionSelect
                id={field.id}
                value={value}
                options={STATUS_OPTIONS}
                onValueChange={onChange}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      <fieldset className="grid grid-cols-1 gap-3 sm:col-span-2">
        <legend className="mb-1 text-sm font-medium">Payment modes</legend>
        <Controller
          control={control}
          name="paymentModes"
          render={({ field: { value, onChange } }) => (
            <>
              {PAYMENT_MODE_OPTIONS.map((option) => (
                <ToggleRow key={option.value} label={option.label}>
                  {({ id }) => (
                    <Checkbox
                      id={id}
                      checked={value.includes(option.value)}
                      onCheckedChange={(checked) =>
                        onChange(toggleMode(value, option.value, checked))
                      }
                    />
                  )}
                </ToggleRow>
              ))}
            </>
          )}
        />
        {errors.paymentModes?.message ? (
          <p role="alert" className="text-destructive text-sm">
            {errors.paymentModes.message}
          </p>
        ) : null}
      </fieldset>

      <Field
        label="Flat shipping"
        error={errors.shipping?.flatMinor?.message ?? moneyTextProblem(watch("shipping.flatMinor"))}
      >
        {(field) => (
          <Controller
            control={control}
            name="shipping.flatMinor"
            render={({ field: { value, onChange, onBlur } }) => (
              <MoneyInput
                id={field.id}
                value={value}
                onChange={(minor) => onChange(minor ?? Number.NaN)}
                onBlur={onBlur}
                currency={currency}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
      <Field
        label="Free shipping over"
        error={
          errors.shipping?.freeOverMinor?.message ??
          moneyTextProblem(watch("shipping.freeOverMinor"))
        }
        hint="Goods total before any discount. Leave empty for no free shipping."
      >
        {(field) => (
          <Controller
            control={control}
            name="shipping.freeOverMinor"
            render={({ field: { value, onChange, onBlur } }) => (
              <MoneyInput
                id={field.id}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                currency={currency}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>
      <Field label="Fewest delivery days" error={errors.shipping?.deliveryDays?.min?.message}>
        {(field) => (
          <Input
            {...field}
            type="number"
            min={0}
            step={1}
            {...register("shipping.deliveryDays.min", { valueAsNumber: true })}
          />
        )}
      </Field>
      <Field
        label="Most delivery days"
        error={
          errors.shipping?.deliveryDays?.max?.message ?? errors.shipping?.deliveryDays?.message
        }
      >
        {(field) => (
          <Input
            {...field}
            type="number"
            min={0}
            step={1}
            {...register("shipping.deliveryDays.max", { valueAsNumber: true })}
          />
        )}
      </Field>

      <AddressRule form={form} field="region" title="Region field" />
      <AddressRule form={form} field="postalCode" title="Postal code field" />

      <Field
        label="Payment instructions"
        error={errors.paymentInstructions?.message}
        hint="Shown to the customer after they order, such as a bank account or wallet number."
        className="sm:col-span-2"
      >
        {(field) => <Textarea {...field} rows={4} {...register("paymentInstructions")} />}
      </Field>
    </div>
  );
}

function AddressRule({
  form,
  field,
  title,
}: {
  form: CountryFormApi;
  field: "region" | "postalCode";
  title: string;
}) {
  const { register, control, formState } = form;
  const error = formState.errors.addressFormat?.[field];
  return (
    <fieldset className="grid grid-cols-1 gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      <Field label="Label shown to customers" error={error?.label?.message}>
        {(labelField) => (
          <Input {...labelField} autoComplete="off" {...register(`addressFormat.${field}.label`)} />
        )}
      </Field>
      <Controller
        control={control}
        name={`addressFormat.${field}.required`}
        render={({ field: { value, onChange } }) => (
          <ToggleRow label="Required">
            {({ id }) => <Checkbox id={id} checked={value} onCheckedChange={onChange} />}
          </ToggleRow>
        )}
      />
    </fieldset>
  );
}
