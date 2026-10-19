"use client";

import { PACKAGING_KINDS } from "@giftpop/contracts";
import type { SavePackagingRequest } from "@giftpop/contracts";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { layoutOptions, slugify } from "../lib/packaging-form";
import type { PackagingFormInput } from "../lib/packaging-form";

import { Field, ToggleRow } from "./field";
import { OptionSelect } from "./option-select";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type PackagingFormApi = UseFormReturn<PackagingFormInput, unknown, SavePackagingRequest>;

interface PackagingDetailsFieldsProps {
  form: PackagingFormApi;
  /** New packagings fill the slug from the name until the slug is edited by hand. */
  autoSlug: boolean;
}

export function PackagingDetailsFields({ form, autoSlug }: PackagingDetailsFieldsProps) {
  const { register, control, watch, setValue, formState } = form;
  const { errors, dirtyFields } = formState;
  const layoutType = watch("layoutType");
  const options = layoutOptions(layoutType).map((option) => ({
    value: option.value,
    label: option.known ? option.value : `${option.value} (not registered)`,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name" error={errors.name?.message}>
        {(field) => (
          <Input
            {...field}
            autoComplete="off"
            {...register("name", {
              onChange: (event: { target: { value: string } }) => {
                if (autoSlug && !dirtyFields.slug) {
                  setValue("slug", slugify(event.target.value), { shouldDirty: false });
                }
              },
            })}
          />
        )}
      </Field>

      <Field
        label="Slug"
        error={errors.slug?.message}
        hint="Lower-case letters, numbers and dashes. Used in links."
      >
        {(field) => (
          <Input {...field} autoComplete="off" spellCheck={false} {...register("slug")} />
        )}
      </Field>

      <Field label="Description" error={errors.description?.message} className="sm:col-span-2">
        {(field) => <Textarea {...field} rows={3} {...register("description")} />}
      </Field>

      <Field
        label="Kind"
        error={errors.kind?.message}
        hint="Groups this packaging in the builder's first question."
      >
        {(field) => (
          <Controller
            control={control}
            name="kind"
            render={({ field: { value, onChange } }) => (
              <OptionSelect
                id={field.id}
                value={value ?? "box"}
                options={PACKAGING_KINDS.map((kind) => ({ value: kind, label: kind }))}
                onValueChange={onChange}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      <Field
        label="Layout type"
        error={errors.layoutType?.message}
        hint="How items are arranged. New layouts are added in code."
      >
        {(field) => (
          <Controller
            control={control}
            name="layoutType"
            render={({ field: { value, onChange } }) => (
              <OptionSelect
                id={field.id}
                value={value}
                options={options}
                onValueChange={onChange}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      <Field
        label="Capacity units"
        error={errors.capacityUnits?.message}
        hint="Total size units that fit."
      >
        {(field) => (
          <Input
            {...field}
            type="number"
            min={1}
            step={1}
            {...register("capacityUnits", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label="Fewest items" error={errors.minItems?.message}>
        {(field) => (
          <Input
            {...field}
            type="number"
            min={1}
            step={1}
            {...register("minItems", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label="Most items" error={errors.maxItems?.message}>
        {(field) => (
          <Input
            {...field}
            type="number"
            min={1}
            step={1}
            {...register("maxItems", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label="Sort order" error={errors.sortOrder?.message} hint="Lower numbers come first.">
        {(field) => (
          <Input
            {...field}
            type="number"
            step={1}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        )}
      </Field>

      <div className="sm:col-span-2">
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <ToggleRow label="Active" description="Inactive packaging is hidden from the store.">
              {({ id }) => <Switch id={id} checked={value} onCheckedChange={onChange} />}
            </ToggleRow>
          )}
        />
      </div>
    </div>
  );
}
